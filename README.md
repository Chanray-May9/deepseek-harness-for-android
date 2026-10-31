# DeepSeek Harness for Android

[![Release](https://img.shields.io/github/v/release/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=release)](https://github.com/Chanray-May9/deepseek-harness-for-android/releases)
[![Stars](https://img.shields.io/github/stars/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=stars)](https://github.com/Chanray-May9/deepseek-harness-for-android/stargazers)
[![Forks](https://img.shields.io/github/forks/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=forks)](https://github.com/Chanray-May9/deepseek-harness-for-android/network)
[![Issues](https://img.shields.io/github/issues/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=issues)](https://github.com/Chanray-May9/deepseek-harness-for-android/issues)
[![Last commit](https://img.shields.io/github/last-commit/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=last%20commit)](https://github.com/Chanray-May9/deepseek-harness-for-android/commits)
[![Commit activity](https://img.shields.io/github/commit-activity/m/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=commits%2Fmonth)](https://github.com/Chanray-May9/deepseek-harness-for-android/graphs/commit-activity)
[![Repo size](https://img.shields.io/github/repo-size/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=repo%20size)](https://github.com/Chanray-May9/deepseek-harness-for-android)
[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](#系统要求)
[![ABI](https://img.shields.io/badge/ABI-arm64--v8a%20%7C%20x86__64-4B8BBE?style=flat-square)](#系统要求)

**在手机上直接运行完整的 DeepSeek Harness。**

不需要电脑，不需要服务器，不需要连任何外部地址。装好之后点图标就能用。

---

## 项目数据

[![Star 增长](https://api.star-history.com/svg?repos=Chanray-May9/deepseek-harness-for-android&type=Date)](https://star-history.com/#Chanray-May9/deepseek-harness-for-android&Date)

<div align="center">

[![贡献热力图](https://ghchart.rshah.org/Chanray-May9)](https://github.com/Chanray-May9)

[![连续提交](https://github-readme-streak-stats.herokuapp.com/?user=Chanray-May9&hide_border=true)](https://github.com/Chanray-May9)

[![仓库概况](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=Chanray-May9&theme=default)](https://github.com/Chanray-May9)

</div>

---

## 目录

- [它是什么](#它是什么)
- [能做什么](#能做什么)
- [快速开始](#快速开始)
- [使用指南](#使用指南)
- [系统要求](#系统要求)
- [为什么能跑在手机上](#为什么能跑在手机上)
- [从源码构建](#从源码构建)
- [仓库结构](#仓库结构)
- [常见问题](#常见问题)
- [致谢](#致谢)

---

## 它是什么

DeepSeek Harness 是一个命令行式的 AI 工作环境：对话、工具调用、文件操作、终端命令、任务编排都在同一个会话里完成。它原本运行在电脑上。

这个项目把它整个搬进了安卓应用。安装包里带着完整的运行环境——一个精简的 Linux 用户空间、一个 Node 运行时、以及 Harness 本体。它们在应用自己的目录里启动，跟系统其他部分互不干扰。

启动后你看到的是熟悉的界面，操作方式按手机重做过：输入框在底部，按钮在拇指能够到的地方，弹出层不会盖住你正要点的东西。

## 能做什么

### 对话

- 流式输出，边生成边显示
- Markdown 渲染，代码块带高亮
- 思考过程可折叠，需要时展开看推理步骤
- 消息可复制，长对话自动滚动到底部

### 模型

- 输入框上方直接切换模型
- 同一位置选择推理等级
- 当前选择即时生效，不需要重开会话

### 工具调用

- 每次工具调用显示为一张卡片：工具名、参数、状态
- 执行结果可展开查看完整输出
- 需要审批的操作会弹出确认，通过或拒绝都在卡片上完成

### 工作区

- 会话按工作区分组，不同项目互不干扰
- 新建、切换、管理工作区
- 会话列表支持搜索与快速定位

### 终端

- 内置完整的命令行环境，不是模拟器
- 可以执行命令、查看文件、安装软件包
- 与对话共用同一份文件系统，改动能立刻被 Harness 看到

### 附件

- 相机拍照、相册选图、文件选择
- 图片直接作为多模态输入发送
- 附件面板是独立弹出，不会占满屏幕

### 设置

- 主题跟随系统 / 深色 / 浅色
- 界面语言：简体中文 / English
- 权限策略、工作区路径、插件管理

## 快速开始

### 1. 下载

到 [Releases](https://github.com/Chanray-May9/deepseek-harness-for-android/releases) 页面下载最新的 `.apk` 文件。

安装包是通用包，`arm64-v8a` 和 `x86_64` 两种架构都在里面，不需要挑选。

### 2. 安装

- 手机设置里允许「安装未知来源应用」
- 点击下载好的 APK 完成安装

### 3. 打开

点桌面图标启动。首次启动需要初始化运行环境——这个过程会解包几百兆的文件，视手机性能大约需要一到三分钟。屏幕上会显示进度。

初始化只发生一次。之后每次启动都在十几秒内进入界面。

### 4. 开始使用

进入欢迎页面后，点输入框输入你的第一个问题即可。想换模型就点输入框上方的模型名称。

## 使用指南

### 输入框的两种形态

- **静置时**是单行胶囊，只占一条窄带，不挡内容
- **聚焦或输入文字后**展开成双行，露出工具栏和模型选择

输入为空、没有附件、也未聚焦时它会自动收回单行。

### 切换模型与推理等级

点输入框中间的模型名称，弹出两层菜单：

```
模型      DeepSeek-V4.1-Flash  ▸
推理等级                  High  ▸
```

点「模型」进入模型列表，「推理等级」进入档位列表。选择即时生效。

### 打开左侧栏

点左上角的图标展开侧栏，里面有新建会话、插件、自动化任务、工作区树和会话历史。再点一次收起。

### 面板

右上角的图标打开右侧面板，内容是当前上下文相关的工具与信息。面板打开时上方按钮会自动隐藏，避免误触。

### 附件

点输入框左下角的 `+`，弹出三个选项：**相机**、**照片**、**文件**。选完立刻关闭，不影响正在输入的内容。

### 终端

侧栏或工作区面板可以进入终端。它运行的是真正的 Ubuntu 用户空间，`apt` 可以装包，`bash` 版本是 5.2，工作目录默认在 `/root/workspace`。

## 系统要求

| 项 | 要求 |
| --- | --- |
| 系统版本 | Android 8.0（API 26）及以上 |
| 处理器架构 | `arm64-v8a` 或 `x86_64` |
| 可用存储 | 建议预留 2 GB 以上 |
| 运行内存 | 建议 4 GB 以上 |
| 网络 | 与模型服务通信时需要 |

安装包约 580 MB，安装后占用会更大一些，因为运行环境要解包。

## 为什么能跑在手机上

Android 默认不允许应用执行自己目录里的程序，也不提供 Linux 的运行时环境。这个项目用三件事绕过去：

1. **低 targetSdk**：把 `targetSdkVersion` 定在 28，这是仍然允许从应用私有目录执行程序的最后一个版本区间。
2. **PRoot**：一个用户态的 `chroot` 实现，不需要 root 就能把某个目录当成文件系统根。它在应用进程内部工作，用自带的 loader 把程序装进这个"根"里运行。
3. **自带运行时**：APK 里打包了一套 Ubuntu 24.04 的精简根文件系统、一个 glibc 版本的 Node 24，以及 Harness 的全部代码。启动时解包到应用私有目录，然后用 PRoot 拉起来。

界面部分是一个 WebView，加载本地启动的 Harness Web 服务。所以它和你熟悉的界面完全一致，只是外面套了一层手机适配。

这些机制都在应用自己的沙箱内，不影响系统其他应用，也不需要 root。

## 从源码构建

### 需要

- JDK 21
- Android SDK（`aapt2`、`d8`、`zipalign`、`apksigner`）
- Node.js（跑构建脚本）
- 运行环境归档（见下）

### 打包 APK

```powershell
tools/rebuild-apk.ps1 `
  -SdkRoot  <Android SDK 路径> `
  -JavaHome <JDK 路径> `
  -ProjectRoot restored/installed-0.2.1-android.5 `
  -Abi both
```

产出在 `restored/installed-0.2.1-android.5/` 目录下。

### 只改界面

界面改动可以不重新打包，直接热推到已连接的设备：

```powershell
tools/sync-shell.cjs
```

它会把样式和脚本写入设备上的 Harness 目录。**改完后需要冷启动应用才生效**（强制停止再打开），单纯刷新页面不会重新加载脚本。

### 运行环境归档

以下文件体积过大，没有放进仓库，需要单独生成：

| 归档 | 内容 |
| --- | --- |
| `harness-{arch}.tar.gz` | Harness 本体与依赖 |
| `node-{arch}.tar.gz` | glibc 版 Node 运行时 |
| `rootfs-{arch}.tar.gz` | Ubuntu 根文件系统 |
| `termux-{arch}.tar.gz` | 内置命令行环境 |
| `loader32-{arch}.bin` | PRoot 的 32 位 loader |

生成脚本在 `tools/` 下（`build-*.cjs`、`build-termux-arm64.cjs`、`build-arm64-rootfs.cjs`）。

### 修改界面

| 文件 | 作用 |
| --- | --- |
| `mobile/phone-shell.rc2.css` | 全部样式：布局、尺寸、动画 |
| `mobile/phone-shell-ext.js` | 全部交互：胶囊、弹出层、抽屉、附件面板、事件分发 |

这两个文件是手机适配的唯一来源，改完用 `sync-shell.cjs` 推送到设备。

## 仓库结构

```
.
├── mobile/                     手机界面源码（样式与交互）
├── tools/                      构建与调试脚本
├── restored/
│   └── installed-0.2.1-android.5/
│       ├── app/src/main/java/  Android 原生层
│       ├── app/src/main/assets/运行环境与前端资源
│       └── AndroidManifest.xml
└── README.md
```

原生层只有三个文件，职责分明：

| 文件 | 负责 |
| --- | --- |
| `MainActivity.java` | WebView 宿主、JS 桥、启动遮罩、系统栏适配、文件导入导出 |
| `RuntimeInstaller.java` | 运行环境解包、PRoot 启动参数、命令行环境初始化 |
| `RuntimeService.java` | 引擎进程生命周期、日志、端口分配、启动地址解析 |

## 常见问题

**首次启动很久，是不是卡住了？**

不是。第一次要解包几百兆的运行环境，一两分钟属正常。屏幕上会显示当前进度，进度在动就是在工作。之后启动会快得多。

**界面一直停在"连接较慢"**

正常情况下十几秒内会进入界面。如果超过一分钟仍未进入，点界面上的「重试」；仍然不行就打开应用菜单里的「查看运行日志」，最后一行的内容能说明卡在哪一步。

**模型选择点了没反应**

点一下左上角的侧栏按钮，再关掉它，之后再点模型名称即可。这是上游组件的一个状态问题，当前版本已在启动时自动处理过一次，遇到重复出现时手动点一次侧栏就能恢复。

**终端里能不能装软件？**

可以。命令行环境里 `apt` 和 `pkg` 都可用，能用系统的包管理器安装需要的工具。装的东西保存在应用私有目录，卸载应用会一并删除。

**会不会影响手机系统？**

不会。整个 Linux 环境在应用沙箱内部运行，不修改系统分区，不需要 root，卸载应用即彻底清除。

**支持平板吗？**

可以安装运行，界面按手机纵向设计，横屏和大屏上的排版尚未专门优化。

## 致谢

界面与运行时来自 DeepSeek Harness，本项目提供安卓端的运行环境与手机适配。

如果这个项目对你有用，欢迎点个 Star。
