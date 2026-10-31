# DeepSeek Harness for Android

The full DeepSeek Harness, running on your phone. No computer, no server, no external connection. Install it, tap the icon, use it.

**[中文](../..) · English · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [ไทย](./README.th.md) · [Português](./README.pt.md) · [Español](./README.es.md) · [Français](./README.fr.md)**

---

[![Release](https://img.shields.io/github/v/release/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=release)](https://github.com/Chanray-May9/deepseek-harness-for-android/releases)
[![Stars](https://img.shields.io/github/stars/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=stars)](https://github.com/Chanray-May9/deepseek-harness-for-android/stargazers)
[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](#requirements)
[![ABI](https://img.shields.io/badge/ABI-arm64--v8a%20%7C%20x86__64-4B8BBE?style=flat-square)](#requirements)

## What it is

DeepSeek Harness is a working environment that puts the model, file access, command execution and task orchestration into a single conversation. It was built for a desktop terminal.
This project moves the whole runtime into an Android app. The APK carries a trimmed Ubuntu user space, a Node runtime and the Harness itself. They unpack into the app's private directory and start there, isolated from the rest of the system.
The interface is the same one you know. Only the layout and the controls were redone for touch: the composer sits at the bottom within thumb reach, popovers never cover the button you are about to press.

## Install

1. Download the latest `.apk` from [Releases](https://github.com/Chanray-May9/deepseek-harness-for-android/releases).
2. Allow installing from unknown sources on the phone.
3. Install and tap the icon.

The first cold start unpacks several hundred megabytes into the app directory and takes one to three minutes depending on the device. The screen shows progress. It happens only once; later starts reach the interface within seconds.

## Requirements

| Item | Requirement |
| --- | --- |
| Android | 8.0 (API 26) or newer |
| CPU | `arm64-v8a` or `x86_64` |
| Storage | 2 GB free recommended |
| RAM | 4 GB recommended |

The APK is about 580 MB and works on both architectures.

## Why it runs on a phone

Android normally forbids executing programs from an app's own directory and provides no Linux runtime. Three things get around that:

- **targetSdk 28** — the last version band that still allows `exec` from the private app directory.
- **PRoot** — a user-space `chroot` that needs no root and makes a directory behave like `/`.
- **A bundled runtime** — a trimmed Ubuntu 24.04 root, a glibc Node 24, and the Harness code, all shipped inside the APK.

Everything stays inside the app sandbox. No system partition is touched, no root is required, and uninstalling removes all of it.

## Build from source

```powershell
tools/rebuild-apk.ps1 `
  -SdkRoot  <android sdk> `
  -JavaHome <jdk 21> `
  -ProjectRoot restored/installed-0.2.1-android.5 `
  -Abi both
```

For interface-only changes, push straight to a connected device:

```powershell
tools/sync-shell.cjs
```

A cold start is required afterwards — reloading the page does not re-run the pushed script.

The runtime archives (`*.tar.gz`) are not in the repository because of their size; generate them with the `tools/build-*.cjs` scripts.

## Status

Current version is **0.2.1-android.5**, an early but usable build. Interface details and interaction are still being refined, so expect frequent updates.

---

**[中文](../..) · English · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [ไทย](./README.th.md) · [Português](./README.pt.md) · [Español](./README.es.md) · [Français](./README.fr.md)**
