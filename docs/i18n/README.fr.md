# DeepSeek Harness for Android

Le DeepSeek Harness complet, exécuté sur votre téléphone. Sans ordinateur, sans serveur, sans connexion externe.

**[中文](../..) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [ไทย](./README.th.md) · [Português](./README.pt.md) · [Español](./README.es.md) · Français**

---

[![Release](https://img.shields.io/github/v/release/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=release)](https://github.com/Chanray-May9/deepseek-harness-for-android/releases)
[![Stars](https://img.shields.io/github/stars/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=stars)](https://github.com/Chanray-May9/deepseek-harness-for-android/stargazers)
[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](#requirements)
[![ABI](https://img.shields.io/badge/ABI-arm64--v8a%20%7C%20x86__64-4B8BBE?style=flat-square)](#requirements)

## Ce que c'est

DeepSeek Harness est un environnement de travail qui réunit la conversation avec le modèle, l'accès aux fichiers, l'exécution de commandes et l'orchestration des tâches dans une seule conversation. Il a été conçu pour le terminal d'un ordinateur de bureau.
Ce projet déplace l'ensemble de l'environnement dans une application Android. L'APK embarque un espace utilisateur Ubuntu allégé, un runtime Node et Harness lui-même. Ils sont extraits dans le répertoire privé de l'application et démarrent là, isolés du reste du système.
L'interface est celle que vous connaissez. Seule la disposition et les commandes ont été refaites pour le tactile : le champ de saisie est en bas, à portée de pouce, et les menus ne recouvrent jamais le bouton que vous allez toucher.

## Installation

1. Téléchargez le dernier `.apk` depuis [Releases](https://github.com/Chanray-May9/deepseek-harness-for-android/releases).
2. Autorisez l'installation depuis des sources inconnues sur le téléphone.
3. Installez, puis touchez l'icône.

Le premier démarrage extrait plusieurs centaines de mégaoctets dans le répertoire de l'application et prend une à trois minutes selon l'appareil. L'écran affiche la progression. Cela n'arrive qu'une fois ; les démarrages suivants atteignent l'interface en quelques secondes.

## Configuration requise

| Élément | Exigence |
| --- | --- |
| Android | 8.0 (API 26) ou supérieur |
| CPU | `arm64-v8a` ou `x86_64` |
| Stockage | 2 Go libres recommandés |
| Mémoire | 4 Go recommandés |

L'APK pèse environ 580 Mo et couvre les deux architectures dans un seul fichier.

## Pourquoi cela tourne sur un téléphone

Android interdit normalement d'exécuter des programmes depuis le répertoire de l'application et ne fournit pas d'environnement Linux. Trois éléments contournent cela :

- **targetSdk 28** — la dernière plage de versions qui autorise encore `exec` depuis le répertoire privé.
- **PRoot** — un `chroot` en espace utilisateur, sans root, qui fait qu'un répertoire se comporte comme `/`.
- **Un runtime embarqué** — racine Ubuntu 24.04 allégée, Node 24 glibc et le code de Harness, le tout dans l'APK.

Tout reste dans le bac à sable de l'application. Aucune partition système n'est modifiée, aucun root n'est requis, et la désinstallation efface tout.

## Compiler depuis les sources

```powershell
tools/rebuild-apk.ps1 `
  -SdkRoot  <android sdk> `
  -JavaHome <jdk 21> `
  -ProjectRoot restored/installed-0.2.1-android.5 `
  -Abi both
```

Pour des changements d'interface uniquement, poussez directement vers un appareil connecté :

```powershell
tools/sync-shell.cjs
```

Un démarrage à froid est nécessaire ensuite — recharger la page ne réexécute pas le script poussé.

Les archives du runtime (`*.tar.gz`) ne sont pas dans le dépôt en raison de leur taille ; générez-les avec les scripts `tools/build-*.cjs`.

## État

La version actuelle est **0.2.1-android.5**, une compilation précoce mais utilisable. Les détails d'interface et les interactions sont encore en cours de finition, attendez-vous donc à des mises à jour fréquentes.

---

**[中文](../..) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [ไทย](./README.th.md) · [Português](./README.pt.md) · [Español](./README.es.md) · Français**
