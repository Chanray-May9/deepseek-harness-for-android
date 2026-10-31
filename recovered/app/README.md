# DeepSeek Harness Android

当前版本：`0.2.1-android.2`。基于官方 Harness `0.2.1-rc.2`，已在用户打开的 MuMu 安卓 15 中完成本轮界面与本地运行验收。

## 本轮修改

- 移除收起状态下的常驻竖向图标栏，只留下左上角抽屉按钮；新会话、插件、自动化、工作区、搜索和账号菜单保留在抽屉内。
- 设置页改为手机整页，顶部为一行可横向滚动的分类；保留原版配色、控件、模型提供商和所有设置项。
- 启动页使用品牌标识和简洁进度。工作区就绪后进入应用，详细技术日志只在失败时通过“查看详情”提供。
- 修复 PRoot 的 `libtalloc.so.2` 别名、WebView 110 缺失的标准 JavaScript API，以及首次默认工作区查找。
- 安卓返回键优先关闭设置、抽屉或工具面板；重新打开界面时复用已有运行环境。
- 沿用手机当前网络的 DNS 配置，在手机本地执行 Harness，不连接电脑作为运行后端。

## 安装和使用

- `DeepSeekHarness-Android-arm64.apk`：原生 ARM64 安卓手机包，最低 Android 9；尚未在 ARM64 真机验收。
- `DeepSeekHarness-Android-x64.apk`：原生 x86_64 包，本轮已安装在 MuMu 中测试。
- 建议预留至少 3 GB 空间。首次安装需要解压约 1 GB 本地运行资源；之后启动会复用已准备的环境。
- 进入原版模型设置，配置自己的 DeepSeek 账号或 API Key。安装包不包含用户凭据。
- 默认工作区位于 `/root/workspace/deepseek-harness/default-workspace`。
- 抽屉中的“本地文件与运行”可导入文件到默认工作区、导出默认工作区 ZIP、查看日志、安装 Git/Python 等工具，以及停止或启动运行环境。
- Git/Python 等开发工具可按需联网安装。基础包已包含 Node、Bash、文件和会话运行时，以及原版客户端和插件代码。

## 验收范围

详见 `VALIDATION.md`、`MUMU-VALIDATION.json` 和 `docs/previews/`。本轮通过了实际 MuMu 安装、冷启动、原生模块检查、本地终端与文件写读、文件浏览、设置分类、深浅色主题、手机宽度和返回键检查。

真实模型请求没有测试，因为没有配置账号或 API Key。ARM64 真机、第三方 MCP 服务、插件执行、语音、附件与系统文件选择器等仍需对应的设备或服务验收。Windows 专用二进制或依赖 Windows API 的插件不能直接由手机上的 Linux 环境执行。因此，本轮结果不等于已证明任意桌面插件在安卓上完全等价。

## 源码构建

依赖：Windows PowerShell、Node 24、npm、JDK 21、Android SDK Platform 35、Build Tools 35.0.0，以及系统 `tar` 和 `curl`。

运行时资源已随源码包附带：

```powershell
npm ci --prefix tools --ignore-scripts
.\tools\build.ps1 -SdkRoot 'SDK 绝对路径' -JavaHome 'JDK 绝对路径' -Abi arm64
.\tools\build.ps1 -SdkRoot 'SDK 绝对路径' -JavaHome 'JDK 绝对路径' -Abi x64
```

`-Abi universal` 可构建包含两种架构的包。若要从固定锁文件重新准备 npm 包和运行时，运行 `tools/prepare.ps1`。

本版本为开发签名，提供 ADB/WebView 调试支持；`app/debug.keystore` 不是公开生产发行的签名密钥。保留 target SDK 28 是为了本地 Linux 用户空间的执行兼容，发布到应用商店需要另行处理分发和平台要求。

## 运行结构

APK 解压 Linux 用户空间、Node 和官方 Harness npm 包；原版 `dsh --profile web` 在手机环回地址上运行，安卓 WebView 显示原版前端。Android 平台适配通过配置覆盖、兼容脚本、手机样式和少量原生文件/生命周期接口完成。

账号、文件和工作区保存在应用私有目录。原版模型调用仍依赖网络和用户自己的模型服务。MuMu 验收脚本见 `tools/qa/`，仅接入这个应用的调试端口。

## 第三方组件

各组件保留自身许可。PRoot 对应源代码、Termux 构建配方、core-js 许可与来源说明见 `third-party/`；APK 的 `third-party-licenses.txt` 保留兼容组件许可。原版 npm、Node 和 Ubuntu 的许可也保留在相应运行资源中。

版本与校验值记录于 `app/src/main/assets/runtime-*.json`，npm 和原生依赖由 `tools/locks/` 固定。
