# DeepSeek Harness for Android

휴대폰에서 바로 실행되는 완전한 DeepSeek Harness. 컴퓨터도, 서버도, 외부 연결도 필요 없습니다.

**[中文](../..) · [English](./README.en.md) · [日本語](./README.ja.md) · 한국어 · [ไทย](./README.th.md) · [Português](./README.pt.md) · [Español](./README.es.md) · [Français](./README.fr.md)**

---

[![Release](https://img.shields.io/github/v/release/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=release)](https://github.com/Chanray-May9/deepseek-harness-for-android/releases)
[![Stars](https://img.shields.io/github/stars/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=stars)](https://github.com/Chanray-May9/deepseek-harness-for-android/stargazers)
[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](#requirements)
[![ABI](https://img.shields.io/badge/ABI-arm64--v8a%20%7C%20x86__64-4B8BBE?style=flat-square)](#requirements)

## 무엇인가

DeepSeek Harness는 모델과의 대화, 파일 조작, 명령 실행, 작업 구성을 하나의 대화로 묶은 작업 환경입니다. 원래는 데스크톱 터미널용으로 만들어졌습니다.
이 프로젝트는 그 실행 환경을 통째로 안드로이드 앱으로 옮겼습니다. APK 안에 우분투 사용자 공간, Node 런타임, Harness 본체가 들어 있고, 앱 전용 디렉터리에 풀어서 실행합니다. 시스템의 다른 부분과는 분리되어 있습니다.
화면은 기존 Harness와 같습니다. 레이아웃과 조작 방식만 터치에 맞게 다시 만들었습니다. 입력창은 엄지가 닿는 아래쪽에 있고, 팝업이 누르려는 버튼을 가리지 않습니다.

## 설치

1. [Releases](https://github.com/Chanray-May9/deepseek-harness-for-android/releases)에서 최신 `.apk`를 내려받습니다.
2. 휴대폰 설정에서 알 수 없는 출처의 앱 설치를 허용합니다.
3. 설치한 뒤 아이콘을 누릅니다.

첫 실행에서는 수백 MB의 환경을 풀어야 하므로 기기에 따라 1~3분 걸립니다. 화면에 진행 상황이 표시됩니다. 초기화는 한 번만 일어나며, 이후에는 십여 초 안에 화면이 뜹니다.

## 요구 사항

| 항목 | 요구 사항 |
| --- | --- |
| Android | 8.0(API 26) 이상 |
| CPU | `arm64-v8a` 또는 `x86_64` |
| 저장 공간 | 2 GB 이상 권장 |
| 메모리 | 4 GB 이상 권장 |

APK는 약 580 MB이며 두 아키텍처를 한 파일에 담고 있습니다.

## 휴대폰에서 실행되는 이유

안드로이드는 기본적으로 앱 전용 디렉터리의 프로그램 실행을 막고, 리눅스 실행 환경도 제공하지 않습니다. 세 가지로 우회합니다.

- **targetSdk 28** — 앱 전용 디렉터리에서 `exec`이 아직 허용되는 마지막 버전대입니다.
- **PRoot** — root 없이 임의의 디렉터리를 `/`로 다루는 사용자 공간 `chroot`입니다.
- **내장 런타임** — 우분투 24.04 루트, glibc Node 24, Harness 본체를 모두 APK에 넣었습니다.

모든 것이 앱 샌드박스 안에서 동작합니다. 시스템 영역을 건드리지 않고 root도 필요 없으며, 앱을 삭제하면 전부 사라집니다.

## 소스에서 빌드

```powershell
tools/rebuild-apk.ps1 `
  -SdkRoot  <android sdk> `
  -JavaHome <jdk 21> `
  -ProjectRoot restored/installed-0.2.1-android.5 `
  -Abi both
```

화면만 수정했다면 연결된 기기로 바로 전송할 수 있습니다.

```powershell
tools/sync-shell.cjs
```

전송 후에는 콜드 스타트가 필요합니다. 페이지를 새로고침해도 스크립트는 다시 실행되지 않습니다.

용량이 커서 런타임 아카이브(`*.tar.gz`)는 저장소에 넣지 않았습니다. `tools/build-*.cjs`로 생성하십시오.

## 상태

현재 버전은 **0.2.1-android.5**이며 초기 실용 버전입니다. 화면 세부와 조작감은 아직 다듬는 중이라 업데이트가 자주 있습니다.

---

**[中文](../..) · [English](./README.en.md) · [日本語](./README.ja.md) · 한국어 · [ไทย](./README.th.md) · [Português](./README.pt.md) · [Español](./README.es.md) · [Français](./README.fr.md)**
