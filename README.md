# DeepSeek Harness for Android

[![Release](https://img.shields.io/github/v/release/Chanray-May9/deepseek-harness-for-android?style=flat-square)](https://github.com/Chanray-May9/deepseek-harness-for-android/releases)
[![Stars](https://img.shields.io/github/stars/Chanray-May9/deepseek-harness-for-android?style=flat-square)](https://github.com/Chanray-May9/deepseek-harness-for-android/stargazers)
[![Forks](https://img.shields.io/github/forks/Chanray-May9/deepseek-harness-for-android?style=flat-square)](https://github.com/Chanray-May9/deepseek-harness-for-android/network)
[![Issues](https://img.shields.io/github/issues/Chanray-May9/deepseek-harness-for-android?style=flat-square)](https://github.com/Chanray-May9/deepseek-harness-for-android/issues)
[![Last commit](https://img.shields.io/github/last-commit/Chanray-May9/deepseek-harness-for-android?style=flat-square)](https://github.com/Chanray-May9/deepseek-harness-for-android/commits)
[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](#要求)
[![ABI](https://img.shields.io/badge/ABI-arm64--v8a%20%7C%20x86__64-4B8BBE?style=flat-square)](#要求)

在手机上直接跑完整的 DeepSeek Harness，不连电脑、不需要服务器。

## 它是什么

一个安卓应用，把 DeepSeek Harness 的完整运行环境内置进 APK。装好之后点图标就能用，所有处理都在手机本地完成。

它和网页版是同一套界面、同一套功能，只针对手机做了排版和操作上的调整。

## 装完能用什么

| 能力 | 说明 |
| --- | --- |
| 对话 | 流式回复、Markdown、代码高亮、思考过程折叠 |
| 模型 | 输入框上方直接切换模型与推理等级 |
| 工具调用 | 卡片式展示，结果可展开 |
| 工作区 | 会话按工作区分组，可切换、可管理 |
| 终端 | 内置命令行环境，可直接执行命令、装软件 |
| 文件 | 相机、相册、文件作为附件发送 |
| 设置 | 主题、语言、权限、工作区、插件 |

## 安装

1. 到 [Releases](https://github.com/Chanray-May9/deepseek-harness-for-android/releases) 下载最新 APK。
2. 手机允许安装未知来源应用。
3. 安装后点图标打开。

首次冷启动需要初始化运行环境，等待界面出现即可，之后启动会快很多。

## 要求

- Android 8.0（API 26）及以上
- 处理器：`arm64-v8a` 或 `x86_64`
- 存储：预留 2 GB 以上
- 安装包已包含两个架构，同一个文件通用

## 界面

- 欢迎页：鲸鱼标志 + 一句开场，输入框在底部
- 对话页：标题栏、消息流、底部输入框
- 侧栏：新建会话、插件、自动化任务、工作区与会话列表
- 设置：模型、权限、主题、语言、关于

## 从源码构建

```
tools/rebuild-apk.ps1        # 编译并打包 APK
tools/sync-shell.cjs         # 把界面改动热推到已连接的设备
```

运行环境所需的归档不在仓库内（体积过大），由 `tools/build-*.cjs` 生成。

## 致谢

界面与运行时来自 DeepSeek Harness。
