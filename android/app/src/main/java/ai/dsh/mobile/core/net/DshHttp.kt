package ai.dsh.mobile.core.net

import ai.dsh.mobile.core.DshJson
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonObject
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.UUID
import java.util.concurrent.TimeUnit

/** Outcome of the `/connect` launch-token exchange. */
data class ConnectResult(val cookie: String, val muxUrl: String?)

/**
 * HTTP half of the DSH client wire protocol.
 *
 * The Host admits API callers through one launch-token exchange: `GET /connect` mints a
 * signed, authority-bound cookie and answers 302 with the mux destination. Every later
 * unary call is `POST /api/<namespace>/<method>` carrying a correlated envelope.
 */
class DshHttp(
    var endpoint: HostEndpoint,
    private val baseClient: OkHttpClient,
) {
    @Volatile
    var cookie: String? = null
        private set

    private val http: OkHttpClient = baseClient.newBuilder()
        .followRedirects(false)
        .followSslRedirects(false)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .build()

    /** Client for long-lived WebSocket mux transport: ping keeps intermediaries warm. */
    val streamingClient: OkHttpClient = baseClient.newBuilder()
        .pingInterval(15, TimeUnit.SECONDS)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .addInterceptor { chain ->
            val builder = chain.request().newBuilder()
            cookie?.let { builder.header("Cookie", it) }
            chain.proceed(builder.build())
        }
        .build()

    fun connect(): ConnectResult {
        val token = endpoint.token?.takeIf { it.isNotBlank() }
            ?: throw RemoteFailure("pair/token-missing", "连接链接缺少口令（token）")
        val url = "${endpoint.origin}/connect".toHttpUrl().newBuilder()
            .addQueryParameter("token", token)
            .addQueryParameter("interactions", "answer")
            .build()
        http.newCall(Request.Builder().url(url).get().build()).execute().use { response ->
            val bodyText = runCatching { response.body?.string().orEmpty() }.getOrDefault("")
            if (response.code !in 300..399) {
                val hint = when (response.code) {
                    401 -> "口令无效或已过期，请在电脑端重新复制带 token 的链接"
                    403 -> "Host 拒绝了该来源地址，检查 trustedHosts / 局域网地址"
                    409 -> "该连接已被占用，关闭上一次会话后重试"
                    else -> "连接失败：HTTP ${response.code}"
                }
                throw RemoteFailure("pair/connect-failed", "$hint（${response.code}）", buildJsonObject {
                    put("status", response.code)
                    put("body", bodyText.take(400))
                })
            }
            val setCookies = response.headers("Set-Cookie")
            val jar = setCookies.mapNotNull { raw ->
                raw.substringBefore(';').trim().takeIf { it.contains('=') && it.length > 3 }
            }
            if (jar.isEmpty()) throw RemoteFailure("pair/no-cookie", "Host 未返回会话 Cookie（HTTP ${response.code}）")
            cookie = jar.joinToString("; ")
            return ConnectResult(cookie = cookie!!, muxUrl = response.header("Location"))
        }
    }

    /** Unary Remote call. Throws [RemoteFailure] for both transport and business failures. */
    fun call(endpoint: String, args: JsonObject, timeoutSeconds: Long = 120): JsonElement {
        val rpcId = UUID.randomUUID().toString()
        val message = """{"type":"client-request","rpcId":"$rpcId","method":"${endpoint.escapeJson()}","payload":{"args":${DshJson.encodeToString(JsonObject.serializer(), args)}}}"""
        val request = Request.Builder()
            .url("${this.endpoint.origin}/api/$endpoint")
            .post(message.toRequestBody(JSON))
            .apply { cookie?.let { header("Cookie", it) } }
            .build()
        val client = http.newBuilder()
            .readTimeout(timeoutSeconds, TimeUnit.SECONDS)
            .callTimeout(timeoutSeconds + 15, TimeUnit.SECONDS)
            .build()
        client.newCall(request).execute().use { response ->
            val text = runCatching { response.body?.string().orEmpty() }.getOrDefault("")
            if (!response.isSuccessful) {
                throw RemoteFailure("gateway/transport", "HTTP ${response.code} on /api/$endpoint", buildJsonObject {
                    put("status", response.code)
                    put("body", text.take(400))
                })
            }
            val envelope = runCatching { DshJson.parseToJsonElement(text) as JsonObject }.getOrNull()
                ?: throw RemoteFailure("gateway/protocol", "响应不是 JSON 信封")
            val gotId = (envelope["rpcId"] as? JsonElement)?.let { DshJson.encodeToString(JsonElement.serializer(), it).trim('"') }
            if (gotId != null && gotId != rpcId) {
                throw RemoteFailure("gateway/protocol", "rpcId 不匹配：期望 $rpcId，收到 $gotId")
            }
            val result = envelope["result"] as? JsonObject
                ?: throw RemoteFailure("gateway/protocol", "响应缺少 result 字段")
            val ok = (result["ok"] as? kotlinx.serialization.json.JsonPrimitive)?.content == "true"
            if (ok) return result["value"] ?: kotlinx.serialization.json.JsonNull
            val error = result["error"] as? JsonObject
                ?: throw RemoteFailure("gateway/protocol", "失败响应缺少 error 字段")
            throw RemoteFailure(
                code = error["code"]?.let { DshJson.encodeToString(JsonElement.serializer(), it).trim('"') } ?: "gateway/internal",
                message = error["message"]?.let { DshJson.encodeToString(JsonElement.serializer(), it).trim('"') } ?: "未知错误",
                details = error["details"] as? JsonObject ?: JsonObject(emptyMap()),
            )
        }
    }

    private fun String.escapeJson(): String = replace("\\", "\\\\").replace("\"", "\\\"")

    companion object {
        private val JSON = "application/json".toMediaType()
    }
}
