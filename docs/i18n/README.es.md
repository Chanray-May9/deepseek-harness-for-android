# DeepSeek Harness for Android

El DeepSeek Harness completo, ejecutándose en tu teléfono. Sin ordenador, sin servidor, sin conexión externa.

**[中文](../..) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [ไทย](./README.th.md) · [Português](./README.pt.md) · Español · [Français](./README.fr.md)**

---

[![Release](https://img.shields.io/github/v/release/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=release)](https://github.com/Chanray-May9/deepseek-harness-for-android/releases)
[![Stars](https://img.shields.io/github/stars/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=stars)](https://github.com/Chanray-May9/deepseek-harness-for-android/stargazers)
[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](#requirements)
[![ABI](https://img.shields.io/badge/ABI-arm64--v8a%20%7C%20x86__64-4B8BBE?style=flat-square)](#requirements)

## Qué es

DeepSeek Harness es un entorno de trabajo que reúne la conversación con el modelo, el acceso a archivos, la ejecución de comandos y la orquestación de tareas en una sola conversación. Se creó para la terminal de escritorio.
Este proyecto traslada todo el entorno a una aplicación Android. El APK incluye un espacio de usuario Ubuntu reducido, un runtime de Node y el propio Harness. Se descomprimen en el directorio privado de la aplicación y arrancan desde ahí, aislados del resto del sistema.
La interfaz es la misma que conoces. Solo la disposición y los controles se rehicieron para el tacto: el campo de entrada está abajo, al alcance del pulgar, y los menús nunca tapan el botón que vas a pulsar.

## Instalación

1. Descarga el `.apk` más reciente desde [Releases](https://github.com/Chanray-May9/deepseek-harness-for-android/releases).
2. Permite la instalación desde orígenes desconocidos en el teléfono.
3. Instálalo y pulsa el icono.

El primer arranque descomprime varios cientos de megabytes en el directorio de la aplicación y tarda entre uno y tres minutos según el dispositivo. La pantalla muestra el progreso. Solo ocurre una vez; los siguientes arranques llegan a la interfaz en segundos.

## Requisitos

| Elemento | Requisito |
| --- | --- |
| Android | 8.0 (API 26) o superior |
| CPU | `arm64-v8a` o `x86_64` |
| Almacenamiento | 2 GB libres recomendados |
| Memoria | 4 GB recomendados |

El APK pesa unos 580 MB y cubre ambas arquitecturas en un solo archivo.

## Por qué funciona en el teléfono

Android normalmente prohíbe ejecutar programas desde el directorio de la propia aplicación y no ofrece un entorno Linux. Tres cosas lo sortean:

- **targetSdk 28** — la última franja de versiones que aún permite `exec` desde el directorio privado.
- **PRoot** — un `chroot` en espacio de usuario, sin root, que hace que cualquier directorio se comporte como `/`.
- **Runtime incluido** — raíz Ubuntu 24.04 reducida, Node 24 glibc y el código del Harness, todo dentro del APK.

Todo permanece dentro del sandbox de la aplicación. No se toca ninguna partición del sistema, no hace falta root, y desinstalar lo elimina todo.

## Compilar desde el código

```powershell
tools/rebuild-apk.ps1 `
  -SdkRoot  <android sdk> `
  -JavaHome <jdk 21> `
  -ProjectRoot restored/installed-0.2.1-android.5 `
  -Abi both
```

Para cambios solo de interfaz, envía directamente a un dispositivo conectado:

```powershell
tools/sync-shell.cjs
```

Después hay que reiniciar la aplicación: recargar la página no vuelve a ejecutar el script enviado.

Los archivos del runtime (`*.tar.gz`) no están en el repositorio por su tamaño; genéralos con los scripts `tools/build-*.cjs`.

## Estado

La versión actual es **0.2.1-android.5**, una compilación temprana pero utilizable. Los detalles de interfaz y la interacción todavía se están puliendo, así que habrá actualizaciones frecuentes.

---

**[中文](../..) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [ไทย](./README.th.md) · [Português](./README.pt.md) · Español · [Français](./README.fr.md)**
