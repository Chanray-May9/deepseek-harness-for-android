package ai.dsh.mobile.core.net

import ai.dsh.mobile.core.DshJson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.channelFlow
import kotlinx.coroutines.flow.filterIsInstance
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Gateway multiplexed Remote transport: one physical WebSocket carries every logical
 * stream as `{open,item,end,cancel}` text frames keyed by a client-minted stream id.
 */
class MuxSocket(
    private val client: OkHttpClient,
    private val scope: CoroutineScope,
) {
    private val streams = ConcurrentHashMap<String, Channel<StreamFrame>>()
    private val socketState = MutableStateFlow(SocketState.IDLE)
    private val internalFrames = MutableSharedFlow<JsonObject>(extraBufferCapacity = 512)
    private var socket: WebSocket? = null
    private var connectContinuation: kotlinx.coroutines.CancellableContinuation<Unit>? = null

    val state: StateFlow<SocketState> = socketState.asStateFlow()

    enum class SocketState { IDLE, CONNECTING, OPEN, CLOSED }

    /** Every inbound frame after routing, useful for `$events` consumers and debugging. */
    val frames: MutableSharedFlow<JsonObject> = internalFrames

    suspend fun connect(url: String) {
        if (socketState.value == SocketState.OPEN) return
        socketState.value = SocketState.CONNECTING
        val request = Request.Builder().url(url).build()
        val ws = client.newWebSocket(request, Listener())
        socket = ws
        suspendCancellableCoroutine { cont ->
            connectContinuation = cont
            cont.invokeOnCancellation { runCatching { ws.cancel() } }
        }
    }

    fun close() {
        runCatching { socket?.close(1000, "client closing") }
        socket = null
        socketState.value = SocketState.CLOSED
        for ((id, channel) in streams) {
            channel.trySend(StreamFrame.Failed(RemoteFailure("gateway/cancelled", "连接已关闭")))
            channel.close()
            streams.remove(id)
        }
    }

    /** Open one logical stream and expose its downlink as a cold flow. */
    fun open(endpoint: String, args: JsonObject = JsonObject(emptyMap())): Flow<JsonElement> = channelFlow {
        val streamId = UUID.randomUUID().toString()
        val inbox = Channel<StreamFrame>(Channel.UNLIMITED)
        streams[streamId] = inbox
        val sink = socket
        if (sink == null || socketState.value != SocketState.OPEN) {
            throw RemoteFailure("gateway/transport", "事件通道尚未就绪")
        }
        val open = buildJsonObject {
            put("type", "open")
            put("streamId", streamId)
            put("endpoint", endpoint)
            put("payload", buildJsonObject { put("args", args) })
        }
        if (!sink.send(open.toString())) {
            streams.remove(streamId)
            throw RemoteFailure("gateway/transport", "事件通道不可用")
        }
        launch { internalFrames.emit(open) }
        try {
            for (frame in inbox) {
                when (frame) {
                    is StreamFrame.Item -> send(frame.value)
                    StreamFrame.End -> break
                    is StreamFrame.Failed -> throw frame.failure
                }
            }
        } finally {
            streams.remove(streamId)
            if (socketState.value == SocketState.OPEN) {
                sink.send("""{"type":"cancel","streamId":"$streamId"}""")
            }
        }
    }

    /** Half-close and drop one stream without waiting for its producer. */
    fun cancel(streamId: String) {
        streams.remove(streamId)
        socket?.send("""{"type":"cancel","streamId":"$streamId"}""")
    }

    private inner class Listener : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            socketState.value = SocketState.OPEN
            connectContinuation?.let { if (it.isActive) it.resume(Unit) }
            connectContinuation = null
            scope.launch {
                internalFrames.emit(buildJsonObject { put("type", "socket-open") })
            }
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            val frame = runCatching { DshJson.parseToJsonElement(text) as? JsonObject }.getOrNull() ?: return
            val type = (frame["type"] as? JsonPrimitive)?.content ?: return
            val streamId = (frame["streamId"] as? JsonPrimitive)?.content
            if (streamId != null) {
                val inbox = streams[streamId] ?: return
                when (type) {
                    "item" -> inbox.trySend(StreamFrame.Item(frame["value"] ?: JsonNull))
                    "end" -> {
                        inbox.trySend(StreamFrame.End)
                        inbox.close()
                        streams.remove(streamId)
                    }
                    "error" -> {
                        val error = frame["error"] as? JsonObject
                        inbox.trySend(
                            StreamFrame.Failed(
                                RemoteFailure(
                                    code = (error?.get("code") as? JsonPrimitive)?.content ?: "gateway/internal",
                                    message = (error?.get("message") as? JsonPrimitive)?.content ?: "流失败",
                                    details = error?.get("details") as? JsonObject ?: JsonObject(emptyMap()),
                                ),
                            ),
                        )
                        inbox.close()
                        streams.remove(streamId)
                    }
                }
            }
            scope.launch { internalFrames.emit(frame) }
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            socketState.value = SocketState.CLOSED
            connectContinuation?.let { if (it.isActive) it.resumeWithException(RemoteFailure("gateway/transport", t.message ?: "websocket 失败", cause = t)) }
            connectContinuation = null
            for ((id, channel) in streams) {
                channel.trySend(StreamFrame.Failed(RemoteFailure("gateway/transport", t.message ?: "连接中断", cause = t)))
                channel.close()
                streams.remove(id)
            }
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            socketState.value = SocketState.CLOSED
            for ((id, channel) in streams) {
                channel.trySend(StreamFrame.End)
                channel.close()
                streams.remove(id)
            }
        }
    }
}
