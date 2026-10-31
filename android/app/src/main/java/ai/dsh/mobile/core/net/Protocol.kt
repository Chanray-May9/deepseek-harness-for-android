package ai.dsh.mobile.core.net

import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

/**
 * The Host's unary RPC failure. `code` follows the Host vocabulary: `gateway/*`,
 * `remote-access/denied`, business codes, and the folded `gateway/cancelled`.
 */
class RemoteFailure(
    val code: String,
    override val message: String,
    val details: JsonObject = JsonObject(emptyMap()),
    cause: Throwable? = null,
) : Exception(message, cause)

/** Where a paired Host lives: the browser-facing origin plus the API mux destination. */
data class HostEndpoint(
    val baseUrl: String,
    val token: String? = null,
    val muxUrl: String? = null,
) {
    val origin: String get() = baseUrl.trimEnd('/')

    /** Same-origin URL with the launch token still attached, for the embedded official UI. */
    fun browserUrl(): String {
        val base = origin
        return if (token.isNullOrBlank()) "$base/" else "$base/?token=${java.net.URLEncoder.encode(token, "UTF-8")}"
    }

    fun websocketUrl(): String {
        val raw = muxUrl?.takeIf { it.isNotBlank() } ?: (origin + "/api/remote.mux")
        return when {
            raw.startsWith("ws://") || raw.startsWith("wss://") -> raw
            raw.startsWith("//") -> "ws:" + raw
            raw.startsWith("/") -> when {
                origin.startsWith("https://") -> "wss://" + origin.removePrefix("https://") + raw
                else -> "ws://" + origin.removePrefix("http://") + raw
            }
            else -> raw
        }
    }

    companion object {
        /**
         * Accepts everything a user may paste: the printed GUI URL, a bare origin,
         * or a `dsh://` deep link carrying `host`/`token` parameters.
         */
        fun parse(input: String): HostEndpoint? {
            var text = input.trim()
            if (text.isEmpty()) return null
            if (text.startsWith("dsh://", ignoreCase = true)) {
                val query = text.substringAfter('?', "")
                val params = query.split('&').filter { it.contains('=') }.associate {
                    val k = it.substringBefore('=')
                    val v = it.substringAfter('=')
                    k to java.net.URLDecoder.decode(v, "UTF-8")
                }
                val host = params["host"] ?: params["url"] ?: return null
                return parse(host)?.copy(token = params["token"] ?: params["t"])
            }
            if (!text.contains("://")) text = "http://$text"
            val url = runCatching { okhttp3.HttpUrl.Companion.toHttpUrl(text) }.getOrNull() ?: run {
                // Tolerate a `?token=` fragment pasted without a scheme.
                val candidate = text.substringBefore('?')
                runCatching { okhttp3.HttpUrl.Companion.toHttpUrl(if (candidate.contains("://")) candidate else "http://$candidate") }.getOrNull()
            } ?: return null
            val token = url.queryParameter("token") ?: url.queryParameter("t")
            val base = buildString {
                append(url.scheme).append("://").append(url.host)
                if (url.port != okhttp3.HttpUrl.defaultPort(url.scheme)) append(':').append(url.port)
            }
            return HostEndpoint(baseUrl = base, token = token)
        }
    }
}

/** One logical Remote stream frame pair: downlink items, end, or a terminal error. */
sealed interface StreamFrame {
    data class Item(val value: JsonElement) : StreamFrame
    data object End : StreamFrame
    data class Failed(val failure: RemoteFailure) : StreamFrame
}
