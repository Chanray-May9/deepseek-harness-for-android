# DeepSeek Harness for Android

O DeepSeek Harness completo, rodando no seu celular. Sem computador, sem servidor, sem conexão externa.

**[中文](../..) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [ไทย](./README.th.md) · Português · [Español](./README.es.md) · [Français](./README.fr.md)**

---

[![Release](https://img.shields.io/github/v/release/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=release)](https://github.com/Chanray-May9/deepseek-harness-for-android/releases)
[![Stars](https://img.shields.io/github/stars/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=stars)](https://github.com/Chanray-May9/deepseek-harness-for-android/stargazers)
[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](#requirements)
[![ABI](https://img.shields.io/badge/ABI-arm64--v8a%20%7C%20x86__64-4B8BBE?style=flat-square)](#requirements)

## O que é

DeepSeek Harness é um ambiente de trabalho que reúne conversa com o modelo, acesso a arquivos, execução de comandos e orquestração de tarefas em uma única conversa. Foi criado para o terminal do desktop.
Este projeto move o ambiente inteiro para dentro de um aplicativo Android. O APK carrega um espaço de usuário Ubuntu enxuto, um runtime Node e o próprio Harness. Eles são extraídos para o diretório privado do aplicativo e iniciam dali, isolados do resto do sistema.
A interface é a mesma que você conhece. Apenas o layout e os controles foram refeitos para o toque: o campo de entrada fica embaixo, ao alcance do polegar, e os menus nunca cobrem o botão que você vai pressionar.

## Instalação

1. Baixe o `.apk` mais recente em [Releases](https://github.com/Chanray-May9/deepseek-harness-for-android/releases).
2. Permita a instalação de fontes desconhecidas no aparelho.
3. Instale e toque no ícone.

A primeira inicialização extrai algumas centenas de megabytes no diretório do aplicativo e leva de um a três minutos, dependendo do aparelho. A tela mostra o progresso. Isso acontece uma única vez; as próximas aberturas chegam à interface em segundos.

## Requisitos

| Item | Requisito |
| --- | --- |
| Android | 8.0 (API 26) ou superior |
| CPU | `arm64-v8a` ou `x86_64` |
| Armazenamento | 2 GB livres recomendados |
| Memória | 4 GB recomendados |

O APK tem cerca de 580 MB e atende as duas arquiteturas em um único arquivo.

## Por que funciona no celular

O Android normalmente proíbe executar programas do diretório do próprio aplicativo e não oferece um ambiente Linux. Três coisas contornam isso:

- **targetSdk 28** — a última faixa de versão que ainda permite `exec` do diretório privado.
- **PRoot** — um `chroot` em espaço de usuário, sem root, que faz qualquer diretório se comportar como `/`.
- **Runtime embarcado** — raiz Ubuntu 24.04 enxuta, Node 24 glibc e o código do Harness, tudo dentro do APK.

Tudo permanece dentro do sandbox do aplicativo. Nenhuma partição do sistema é alterada, não é preciso root, e desinstalar remove tudo.

## Compilar do código-fonte

```powershell
tools/rebuild-apk.ps1 `
  -SdkRoot  <android sdk> `
  -JavaHome <jdk 21> `
  -ProjectRoot restored/installed-0.2.1-android.5 `
  -Abi both
```

Para mudanças apenas na interface, envie direto para um aparelho conectado:

```powershell
tools/sync-shell.cjs
```

É necessário reiniciar o aplicativo depois — recarregar a página não reexecuta o script enviado.

Os arquivos do runtime (`*.tar.gz`) não estão no repositório por causa do tamanho; gere-os com os scripts `tools/build-*.cjs`.

## Estado

A versão atual é **0.2.1-android.5**, uma compilação inicial porém utilizável. Detalhes de interface e interação ainda estão sendo refinados, então espere atualizações frequentes.

---

**[中文](../..) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [ไทย](./README.th.md) · Português · [Español](./README.es.md) · [Français](./README.fr.md)**
