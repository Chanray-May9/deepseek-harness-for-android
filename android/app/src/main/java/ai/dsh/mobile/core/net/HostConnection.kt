package ai.dsh.mobile.core.net

import ai.dsh.mobile.core.DshJson
import ai.dsh.mobile.core.bool
import ai.dsh.mobile.core.num
import ai.dsh.mobile.core.obj
import ai.dsh.mobile.core.str
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit
import kotlin.math.min

/** Observable connection lifecycle, mirroring the Host's generation model. */
sealed interface ConnState {
    data object Idle : ConnState
    data class Connecting(val attempt: Int = 0) : ConnState
    data class Connected(val home: String?, val versionLabel: String?) : ConnState
    data class Failed(val reason: String) : ConnState
}

/**
 * One live pairing with a Harness Host: HTTP RPC, the multiplexed event mux, and the
 * forwarded `$events` generation. Screens read [state]; flows restart themselves across
 * carrier loss because every stream re-opens against the current socket.
 */
class HostConnection(
    private val scope: CoroutineScope,
    baseClient: OkHttpClient = defaultClient(),
) {
    private val baseClient = baseClient

    var endpoint: HostEndpoint? = null
        private set

    private var http: DshHttp? = null
    private var mux: MuxSocket? = null
    private var eventsJob: Job? = null

    private val _state = MutableStateFlow<ConnState>(ConnState.Idle)
    val state: StateFlow<ConnState> = _state.asStateFlow()

    private val _events = MutableSharedFlow<JsonObject>(extraBufferCapacity = 2048)
    /** Forwarded application events: `api-session/*`, `agent/*`, and `approval` waterfalls. */
    val events = _events.asSharedFlow()

    val isConnected: Boolean get() = _state.value is ConnState.Connected

    suspend fun connect(target: HostEndpoint) {
        disconnect()
        _state.value = ConnState.Connecting()
        endpoint = target
        val transport = DshHttp(target, baseClient)
        http = transport
        try {
            val handshake = transport.connect()
            val resolved = target.copy(muxUrl = handshake.muxUrl ?: target.muxUrl)
            endpoint = resolved
            connectSocket(resolved, requiresHandshake = false)
        } catch (failure: RemoteFailure) {
            _state.value = ConnState.Failed(failure.message)
            throw failure
        }
    }

    private suspend fun connectSocket(target: HostEndpoint, requiresHandshake: Boolean) {
        val transport = http ?: throw RemoteFailure("gateway/transport", "尚未完成连接握手")
        if (requiresHandshake) transport.connect()
        val socket = MuxSocket(transport.streamingClient, scope)
        mux = socket
        socket.connect(target.websocketUrl())
        _state.value = ConnState.Connected(home = null, versionLabel = null)
        startEventPump()
    }

    private fun startEventPump() {
        eventsJob?.cancel()
        eventsJob = scope.launch {
            var backoff = 500L
            while (true) {
                val socket = mux ?: return@launch
                try {
                    socket.open("\$events", JsonObject(emptyMap())).collect { frame ->
                        val obj = frame as? JsonObject ?: return@collect
                        when (obj.str("type")) {
                            "ready" -> {
                                val home = obj.obj("host")?.str("home")
                                _state.value = ConnState.Connected(home = home, versionLabel = null)
                            }
                            "emit", "waterfall" -> {
                                _events.emit(obj)
                                backoff = 500L
                            }
                        }
                    }
                } catch (_: Throwable) {
                    // Carrier loss: rebuild the socket once, then reopen the generation.
                }
                if (!isConnected) _state.value = ConnState.Connecting()
                delay(backoff + (0..200).random())
                backoff = min(backoff * 2, 10_000L)
                runCatching { reconnectSocket() }
            }
        }
    }

    private suspend fun reconnectSocket() {
        val target = endpoint ?: return
        http?.connect() ?: return
        val socket = mux
        val transport = http ?: return
        val fresh = MuxSocket(transport.streamingClient, scope)
        fresh.connect(target.websocketUrl())
        mux = fresh
        // Retire the previous socket without disturbing the new one.
        if (socket != null && socket !== fresh) socket.close()
        _state.value = ConnState.Connected(home = null, versionLabel = null)
    }

    fun disconnect() {
        eventsJob?.cancel()
        eventsJob = null
        mux?.close()
        mux = null
        http = null
        endpoint = null
        _state.value = ConnState.Idle
    }

    /** Unary call. Endpoint names are the Host's `<namespace>/<method>` pairs. */
    suspend fun rpc(endpoint: String, args: JsonObject = JsonObject(emptyMap())): JsonElement {
        val transport = http ?: throw RemoteFailure("gateway/transport", "尚未连接 Host")
        return transport.call(endpoint, args)
    }

    /**
     * Open one logical stream. Transparently reconnects the carrier once per attempt while
     * the caller keeps collecting, matching the Host's generation semantics.
     */
    fun stream(endpoint: String, args: JsonObject = JsonObject(emptyMap())): Flow<JsonElement> = flow {
        var attempts = 0
        while (true) {
            val socket = ensureSocket()
            try {
                socket.open(endpoint, args).collect { emit(it) }
                return@flow
            } catch (failure: RemoteFailure) {
                attempts += 1
                if (attempts > 5) throw failure
                delay(min(500L * attempts, 4000L))
                runCatching { reconnectSocket() }
            }
        }
    }

    private suspend fun ensureSocket(): MuxSocket {
        val current = mux
        if (current != null && current.state.value == MuxSocket.SocketState.OPEN) return current
        val target = endpoint ?: throw RemoteFailure("gateway/transport", "尚未连接 Host")
        runCatching { reconnectSocket() }
        return mux ?: run {
            val transport = http ?: throw RemoteFailure("gateway/transport", "尚未连接 Host")
            transport.connect()
            val fresh = MuxSocket(transport.streamingClient, scope)
            fresh.connect(target.websocketUrl())
            mux = fresh
            fresh
        }
    }

    /** Answer a forwarded event waterfall (`approval/*`, ask-user prompts). */
    suspend fun answerEvent(clientId: String, eventId: String, value: JsonElement?) {
        val args = kotlinx.serialization.json.buildJsonObject {
            put("clientId", JsonPrimitive(clientId))
            put("eventId", JsonPrimitive(eventId))
            put("outcome", kotlinx.serialization.json.buildJsonObject {
                put("kind", JsonPrimitive("result"))
                if (value != null) put("value", value)
            })
        }
        rpc("\$events/result", args)
    }

    /** Continue one waterfall to the next listener without answering it. */
    suspend fun passEvent(clientId: String, eventId: String) {
        val args = kotlinx.serialization.json.buildJsonObject {
            put("clientId", JsonPrimitive(clientId))
            put("eventId", JsonPrimitive(eventId))
            put("outcome", kotlinx.serialization.json.buildJsonObject { put("kind", JsonPrimitive("next")) })
        }
        rpc("\$events/result", args)
    }

    companion object {
        fun defaultClient(): OkHttpClient = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }
}
