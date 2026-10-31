# DSH Mobile 设计说明（内部）

## 1. 为什么是「客户端」而不是「手机内跑 Harness」

DSH 的 Host 是 Node + 原生扩展（node-pty / sharp / koffi / sherpa-onnx）构成的 Cordis 插件树，无法在 Android 上原样运行。因此「功能完全一致」的正确解法是：

- **协议层完全一致**：手机端实现 Host 的官方客户端线协议（`/connect` 握手、`/api/<endpoint>` 一元 RPC、`/api/remote.mux` 多路复用流、`$events` 事件流），与官方网页客户端说同一种话。
- **界面层双引擎**：
  - `native`：Compose 重写的触屏界面，覆盖高频路径；
  - `web`：内嵌官方前端（同一 Host 同源加载），任何原生还没覆盖的能力在这里 1:1 可用。

两条引擎共享同一个 `HostConnection`（cookie、连接代际、重连、事件分发），所以切换引擎不会断流。

## 2. 模块划分

```
ai.dsh.mobile
├── core/                    纯 Kotlin，无 Android 依赖（可 JVM 单测）
│   ├── net/
│   │   ├── ConnectHandshake.kt   GET /connect 换 cookie + mux 地址
│   │   ├── CookieJar.kt          内存 + 持久化 cookie（按 authority 绑定）
│   │   ├── RpcClient.kt          POST /api/<endpoint> 信封编解码
│   │   ├── MuxSocket.kt          /api/remote.mux 帧协议 + 逻辑流表
│   │   ├── RemoteStream.kt       单逻辑流的 Flow<JsonElement>
│   │   └── HostConnection.kt     连接代际、重连退避、$events 分发
│   ├── proto/                   端点 DTO（kotlinx.serialization）
│   ├── session/                 SessionRepository：列表/页面/流式投影
│   └── settings/                SettingsRepository：模型、权限预设
├── ui/
│   ├── theme/                   深色优先的 Material3 主题
│   ├── screens/connect/         扫码 / 粘贴 / 手填
│   ├── screens/sessions/        会话列表 + 搜索 + 分组
│   ├── screens/chat/            消息流、工具卡、审批、输入栏
│   ├── screens/web/             官方前端 WebView（全量模式）
│   ├── screens/settings/        连接、模型、权限、外观
│   └── components/              Markdown、代码块、工具卡、状态徽标
├── platform/                    前台服务、通知、分享入口、生物识别
└── di/                          手写依赖容器（不引 Hilt）
```

## 3. 线协议要点（详见 PROTOCOL.md）

### 3.1 配对

```
GET {base}/connect?token={TOKEN}&interactions=answer
→ 302, Set-Cookie: <authority 绑定名>=<signed>; Path=/; HttpOnly; SameSite=Strict
→ Location: {mux 目标}
```

`interactions=answer` 才允许接收 `$events`（转发事件/审批）。API 端 cookie 与该 WebSocket 生命周期绑定：socket 关闭后需重新 `/connect`。

### 3.2 一元 RPC

```
POST {base}/api/{endpoint}            # endpoint 形如 session/list
Content-Type: application/json
{"type":"client-request","rpcId":"<uuid>","method":"session/list","payload":{"args":{...}}}

→ {"type":"server-response","rpcId":"<uuid>","result":{"ok":true,"value":...}}
→ {"type":"server-response","rpcId":"<uuid>","result":{"ok":false,"error":{"code","message","details"}}}
```

`rpcId` 必须回环校验；`ok:false` 用 `code` 分类（`gateway/*`、`remote-access/denied` 等）。

### 3.3 流

WebSocket `{base→ws}/api/remote.mux`，文本帧：

| 方向 | 帧 |
| --- | --- |
| C→H | `{"type":"open","streamId","endpoint","payload":{"args":{}}}` |
| C→H | `{"type":"item","streamId","value"}` / `{"type":"end","streamId"}` / `{"type":"cancel","streamId"}` |
| H→C | `{"type":"item","streamId","value"}` / `{"type":"end","streamId"}` / `{"type":"error","streamId","error":{code,message,details}}` |

`$events` 首帧固定 `{"type":"ready","clientId","host":{"home"}}`，之后是事件帧。心跳为 WebSocket 协议层 Ping（默认 2s）。

### 3.4 事件

`$events` 承载会话增量（`api-session/activity|added|removed|status|error` 等）与审批瀑布；审批答复走 `$events/result`（`{clientId, eventId, outcome:{kind:'result'|'next'|'rejected'}}`）。

## 4. 状态与线程

- `HostConnection` 单例（Application 作用域），内部 OkHttp Dispatcher + 单写协程发送帧。
- 每会话一个 `SessionViewModel`，持有 `session/follow` 流；切后台由前台服务保活，UI 只做只读投影。
- 断线：指数退避 + 抖动（500ms→10s），恢复后重开 `$events` 与活动会话流。
- 事件顺序以 `seq` 为准，UI 侧按 `seq` 插入，重复投递幂等。

## 5. 全量模式（WebView）

- 加载 `{base}/?token={TOKEN}` → 302 写 cookie → 后续同源请求自动带 cookie。
- `WebView` 开启 `domStorage`、`database`；`CookieManager` 与原生 `CookieJar` 双向同步（同一 authority）。
- 文件下载交给系统 DownloadManager，外链交浏览器；主题跟随设置注入。
- 返回键优先走 Web 历史，返回栈为空再退出 web 模式。

## 6. 测试

- `core` 全部可在 JVM 运行：`gradlew testDebugUnitTest`。
- `tools/mock-host.mjs` 实现同一协议（含随机延迟与断线），用于端到端回归：握手 → 列表 → 发送 → 流式增量 → 审批 → 断线重连。
- UI 冒烟：`gradlew assembleDebug` + 手动装包。

## 7. 已知边界

- 附件上传走 multipart 直传，受 Host `maxRequestBodyBytes`（默认 300 MiB）限制。
- 语音输入依赖 Host 的 speech-to-text 端点；宿主未启用时自动隐藏麦克风。
- 终端为实验能力，默认关闭，可在设置里打开（xterm.js in WebView，与全量模式共用会话）。
