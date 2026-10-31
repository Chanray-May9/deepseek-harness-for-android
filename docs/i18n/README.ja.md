# DeepSeek Harness for Android

スマートフォンだけで動く完全な DeepSeek Harness。パソコンもサーバーも外部接続も不要です。

**[中文](../..) · [English](./README.en.md) · 日本語 · [한국어](./README.ko.md) · [ไทย](./README.th.md) · [Português](./README.pt.md) · [Español](./README.es.md) · [Français](./README.fr.md)**

---

[![Release](https://img.shields.io/github/v/release/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=release)](https://github.com/Chanray-May9/deepseek-harness-for-android/releases)
[![Stars](https://img.shields.io/github/stars/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=stars)](https://github.com/Chanray-May9/deepseek-harness-for-android/stargazers)
[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](#requirements)
[![ABI](https://img.shields.io/badge/ABI-arm64--v8a%20%7C%20x86__64-4B8BBE?style=flat-square)](#requirements)

## これは何か

DeepSeek Harness は、モデルとの対話・ファイル操作・コマンド実行・タスク編成をひとつの会話にまとめた作業環境です。もともとはデスクトップのターミナル向けに作られています。
このプロジェクトは、その実行環境をまるごと Android アプリに移しました。APK の中に Ubuntu のユーザー空間、Node ランタイム、Harness 本体が入っており、アプリ専用ディレクトリに展開して起動します。システムの他の部分とは切り離されています。
画面はいつもの Harness と同じです。レイアウトと操作だけをタッチ向けに作り直しました。入力欄は親指の届く下側にあり、ポップアップが押そうとしたボタンを覆うことはありません。

## インストール

1. [Releases](https://github.com/Chanray-May9/deepseek-harness-for-android/releases) から最新の `.apk` をダウンロードします。
2. 端末の設定で「提供元不明のアプリ」を許可します。
3. インストールしてアイコンをタップします。

初回起動では数百 MB の環境を展開するため、端末によって 1〜3 分かかります。画面に進捗が出ます。初期化は一度だけで、以降は十数秒で画面に入ります。

## 動作要件

| 項目 | 要件 |
| --- | --- |
| Android | 8.0（API 26）以上 |
| CPU | `arm64-v8a` または `x86_64` |
| 空き容量 | 2 GB 以上を推奨 |
| メモリ | 4 GB 以上を推奨 |

APK は約 580 MB で、両方のアーキテクチャを 1 つのファイルに含みます。

## スマートフォンで動く理由

Android は通常、アプリ専用ディレクトリからのプログラム実行を禁止し、Linux の実行環境も提供しません。次の三点で回避しています。

- **targetSdk 28** — アプリ専用ディレクトリからの `exec` がまだ許可されている最後のバージョン帯です。
- **PRoot** — root を必要とせず、任意のディレクトリを `/` として扱えるユーザー空間の `chroot` です。
- **同梱ランタイム** — Ubuntu 24.04 のルート、glibc 版 Node 24、Harness 本体をすべて APK に収めています。

すべてアプリのサンドボックス内で完結します。システム領域には触れず、root も不要で、アンインストールすればすべて消えます。

## ソースからビルド

```powershell
tools/rebuild-apk.ps1 `
  -SdkRoot  <android sdk> `
  -JavaHome <jdk 21> `
  -ProjectRoot restored/installed-0.2.1-android.5 `
  -Abi both
```

画面だけを変更した場合は、接続中の端末へ直接転送できます。

```powershell
tools/sync-shell.cjs
```

転送後はコールドスタートが必要です。ページの再読み込みではスクリプトが再実行されません。

サイズが大きいため、ランタイムのアーカイブ（`*.tar.gz`）はリポジトリに含めていません。`tools/build-*.cjs` で生成してください。

## 状態

現在のバージョンは **0.2.1-android.5** で、初期の実用版です。画面の細部と操作感はまだ調整中で、更新は頻繁に入ります。

---

**[中文](../..) · [English](./README.en.md) · 日本語 · [한국어](./README.ko.md) · [ไทย](./README.th.md) · [Português](./README.pt.md) · [Español](./README.es.md) · [Français](./README.fr.md)**
