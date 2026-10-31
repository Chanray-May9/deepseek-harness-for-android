package ai.dsh.mobile.core

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.put

/** Wire JSON: the Host is permissive about unknown fields and emits compact payloads. */
val DshJson: Json = Json {
    ignoreUnknownKeys = true
    isLenient = true
    explicitNulls = false
    encodeDefaults = true
    allowSpecialFloatingPointValues = true
}

fun JsonObject.str(key: String): String? =
    (this[key] as? JsonPrimitive)?.takeIf { it !is JsonNull }?.contentOrNull

fun JsonObject.num(key: String): Long? =
    (this[key] as? JsonPrimitive)?.longOrNull ?: (this[key] as? JsonPrimitive)?.doubleOrNull?.toLong()

fun JsonObject.dbl(key: String): Double? = (this[key] as? JsonPrimitive)?.doubleOrNull

fun JsonObject.bool(key: String): Boolean? = (this[key] as? JsonPrimitive)?.booleanOrNull

fun JsonObject.obj(key: String): JsonObject? = this[key] as? JsonObject

fun JsonObject.arr(key: String): JsonArray? = this[key] as? JsonArray

fun JsonObject.deep(path: String): JsonElement? {
    var current: JsonElement = this
    for (part in path.split('.')) {
        current = when (val c = current) {
            is JsonObject -> c[part] ?: return null
            is JsonArray -> part.toIntOrNull()?.let { c.getOrNull(it) } ?: return null
            else -> return null
        }
    }
    return current
}

fun JsonObject.textList(key: String): List<String> =
    arr(key)?.mapNotNull { (it as? JsonPrimitive)?.contentOrNull } ?: emptyList()

fun jsonObjectOf(vararg pairs: Pair<String, JsonElement?>): JsonObject = buildJsonObject {
    for ((k, v) in pairs) if (v != null) put(k, v)
}

fun jsonString(value: String): JsonPrimitive = JsonPrimitive(value)

fun JsonObject.orEmpty(): JsonObject = this

/** Render one JSON value for debug/log surfaces without dumping binary-ish blobs. */
fun JsonElement.preview(max: Int = 240): String {
    val text = toString()
    return if (text.length <= max) text else text.take(max) + "…"
}
