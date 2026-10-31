package ai.dsh.mobile.core.model

import ai.dsh.mobile.core.arr
import ai.dsh.mobile.core.bool
import ai.dsh.mobile.core.deep
import ai.dsh.mobile.core.num
import ai.dsh.mobile.core.obj
import ai.dsh.mobile.core.str
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

/** One row of `session/list`: the durable summary plus its projection block. */
data class SessionRow(
    val sessionId: String,
    val title: String?,
    val cwd: String?,
    val updatedAt: Long,
    val running: Boolean,
    val blank: Boolean,
    val agentAvailable: Boolean,
    val parentSessionId: String? = null,
    val origin: String? = null,
    val provider: String? = null,
    val model: String? = null,
    val todos: List<TodoItem> = emptyList(),
) {
    val displayTitle: String
        get() = title?.takeIf { it.isNotBlank() } ?: "新建会话"
    val isSubagent: Boolean get() = origin == "subagent" || parentSessionId != null

    companion object {
        fun from(json: JsonObject): SessionRow? {
            val id = json.str("sessionId") ?: return null
            val values = json.obj("projections")?.obj("values")
            val modelBlock = values?.get("model") as? JsonObject
            return SessionRow(
                sessionId = id,
                title = values?.str("title"),
                cwd = json.str("cwd") ?: values?.str("workingDirectory"),
                updatedAt = json.num("updatedAt") ?: 0L,
                running = json.bool("running") == true,
                blank = json.bool("blank") == true,
                agentAvailable = json.bool("agentAvailable") == true,
                parentSessionId = json.str("parentSessionId"),
                origin = json.str("origin"),
                provider = modelBlock?.str("provider"),
                model = modelBlock?.str("model"),
                todos = values?.get("todos")?.let { TodoItem.listFrom(it) } ?: emptyList(),
            )
        }
    }
}

data class TodoItem(val content: String, val status: String) {
    companion object {
        fun listFrom(element: kotlinx.serialization.json.JsonElement?): List<TodoItem> {
            val array = element as? JsonArray ?: return emptyList()
            return array.mapNotNull { entry ->
                val obj = entry as? JsonObject ?: return@mapNotNull null
                val content = obj.str("content") ?: return@mapNotNull null
                TodoItem(content, obj.str("status") ?: "pending")
            }
        }
    }
}

/** One durable Session log event, exactly as the Host frames it. */
data class SessionEvent(
    val type: String,
    val seq: Long,
    val time: Long,
    val data: JsonObject,
    val raw: JsonObject,
) {
    val ignorable: Boolean get() = raw.bool("ignorable") == true

    companion object {
        fun from(json: JsonObject): SessionEvent? {
            val type = json.str("type") ?: return null
            return SessionEvent(
                type = type,
                seq = json.num("seq") ?: 0L,
                time = json.num("time") ?: 0L,
                data = json.obj("data") ?: JsonObject(emptyMap()),
                raw = json,
            )
        }
    }
}

data class SessionHeader(
    val id: String,
    val cwd: String?,
    val createdAt: Long,
    val parentSession: String?,
) {
    companion object {
        fun from(json: JsonObject): SessionHeader = SessionHeader(
            id = json.str("id") ?: "",
            cwd = json.str("cwd"),
            createdAt = json.num("createdAt") ?: 0L,
            parentSession = json.str("parentSession"),
        )
    }
}

/** One `session/follow` downlink item. */
sealed interface FollowFrame {
    data class Snapshot(
        val header: SessionHeader?,
        val cursor: Long?,
        val records: List<SessionEvent>,
        val hasMore: Boolean,
    ) : FollowFrame

    data class Event(val event: SessionEvent) : FollowFrame
    data class AssistantStream(val frame: JsonObject) : FollowFrame

    companion object {
        fun from(json: JsonObject): FollowFrame? = when (json.str("type")) {
            "snapshot" -> Snapshot(
                header = json.obj("header")?.let { SessionHeader.from(it) },
                cursor = json.num("cursor") ?: json.obj("cursor")?.num("seq"),
                records = json.arr("records")?.mapNotNull { record ->
                    val wrapper = record as? JsonObject ?: return@mapNotNull null
                    val ev = wrapper.obj("event") ?: wrapper
                    SessionEvent.from(ev)
                } ?: emptyList(),
                hasMore = json.bool("hasMore") == true,
            )
            "event" -> (json.obj("event"))?.let { SessionEvent.from(it) }?.let { Event(it) }
            "assistant-stream" -> json.obj("frame")?.let { AssistantStream(it) }
            else -> null
        }
    }
}

/** One page of history, addressed by the follow opening cursor. */
data class HistoryPage(val records: List<SessionEvent>, val hasMore: Boolean)

/** A workspace row from `workspace/follow`. */
data class WorkspaceRow(
    val workspaceId: String,
    val path: String,
    val title: String,
    val sessionIds: List<String>,
)

/** A directory entry from `workspaceFiles/list`. */
data class FileEntry(
    val name: String,
    val path: String,
    val isDirectory: Boolean,
    val size: Long?,
    val modifiedAt: Long?,
)

data class ModelOption(
    val provider: String,
    val model: String,
    val label: String,
    val efforts: List<Pair<String, String>> = emptyList(),
    val defaultEffort: String? = null,
) {
    val key: String get() = "$provider::$model"
}

data class ApprovalRequest(
    val eventId: String,
    val clientId: String,
    val agentId: String?,
    val toolName: String,
    val reason: String?,
    val callId: String?,
    val raw: JsonObject,
)

/** Rendered timeline entries. */
sealed interface ChatItem {
    val key: String

    data class User(
        override val key: String,
        val text: String,
        val images: List<String> = emptyList(),
        val time: Long = 0L,
    ) : ChatItem

    data class Assistant(
        override val key: String,
        val text: String,
        val reasoning: String = "",
        val time: Long = 0L,
        val streaming: Boolean = false,
        val interrupted: Boolean = false,
    ) : ChatItem

    data class Tool(
        override val key: String,
        val callId: String,
        val name: String,
        val arguments: String,
        val result: String? = null,
        val isError: Boolean = false,
        val time: Long = 0L,
        val finished: Boolean = false,
    ) : ChatItem

    data class Notice(
        override val key: String,
        val text: String,
        val level: Level = Level.INFO,
    ) : ChatItem {
        enum class Level { INFO, WARN, ERROR }
    }

    data class Todos(override val key: String, val items: List<TodoItem>) : ChatItem

    data class Approval(
        override val key: String,
        val id: String,
        val toolName: String,
        val reason: String?,
        val outcome: String? = null,
    ) : ChatItem
}

fun JsonArray.primitiveTexts(): List<String> = mapNotNull { (it as? JsonPrimitive)?.content }
