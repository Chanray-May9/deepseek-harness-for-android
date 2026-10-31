// Generate localised READMEs and wire up the language switcher.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'docs', 'i18n');
fs.mkdirSync(dir, { recursive: true });

const REPO = 'Chanray-May9/deepseek-harness-for-android';
const BADGE = (label, url) => `[![${label}](${url})](https://github.com/${REPO})`;

const badges = `[![Release](https://img.shields.io/github/v/release/${REPO}?style=flat-square&label=release)](https://github.com/${REPO}/releases)
[![Stars](https://img.shields.io/github/stars/${REPO}?style=flat-square&label=stars)](https://github.com/${REPO}/stargazers)
[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](#requirements)
[![ABI](https://img.shields.io/badge/ABI-arm64--v8a%20%7C%20x86__64-4B8BBE?style=flat-square)](#requirements)`;

const nav = (self) => {
  const langs = [
    ['zh', '简体中文', '../..'],
    ['en', 'English', './README.en.md'],
    ['ja', '日本語', './README.ja.md'],
    ['ko', '한국어', './README.ko.md'],
    ['th', 'ไทย', './README.th.md'],
    ['pt', 'Português', './README.pt.md'],
    ['es', 'Español', './README.es.md'],
    ['fr', 'Français', './README.fr.md'],
  ];
  return (
    '**' +
    langs
      .map(([code, label, href]) => (code === self ? label : `[${label}](${href})`))
      .join(' · ') +
    '**'
  );
};

const pages = {
  en: {
    title: 'DeepSeek Harness for Android',
    tag: 'The full DeepSeek Harness, running on your phone. No computer, no server, no external connection. Install it, tap the icon, use it.',
    secs: [
      ['What it is', [
        'DeepSeek Harness is a working environment that puts the model, file access, command execution and task orchestration into a single conversation. It was built for a desktop terminal.',
        'This project moves the whole runtime into an Android app. The APK carries a trimmed Ubuntu user space, a Node runtime and the Harness itself. They unpack into the app\'s private directory and start there, isolated from the rest of the system.',
        'The interface is the same one you know. Only the layout and the controls were redone for touch: the composer sits at the bottom within thumb reach, popovers never cover the button you are about to press.',
      ]],
      ['Install', [
        '1. Download the latest `.apk` from [Releases](https://github.com/' + REPO + '/releases).',
        '2. Allow installing from unknown sources on the phone.',
        '3. Install and tap the icon.',
        '',
        'The first cold start unpacks several hundred megabytes into the app directory and takes one to three minutes depending on the device. The screen shows progress. It happens only once; later starts reach the interface within seconds.',
      ]],
      ['Requirements', [
        '| Item | Requirement |',
        '| --- | --- |',
        '| Android | 8.0 (API 26) or newer |',
        '| CPU | `arm64-v8a` or `x86_64` |',
        '| Storage | 2 GB free recommended |',
        '| RAM | 4 GB recommended |',
        '',
        'The APK is about 580 MB and works on both architectures.',
      ]],
      ['Why it runs on a phone', [
        'Android normally forbids executing programs from an app\'s own directory and provides no Linux runtime. Three things get around that:',
        '',
        '- **targetSdk 28** — the last version band that still allows `exec` from the private app directory.',
        '- **PRoot** — a user-space `chroot` that needs no root and makes a directory behave like `/`.',
        '- **A bundled runtime** — a trimmed Ubuntu 24.04 root, a glibc Node 24, and the Harness code, all shipped inside the APK.',
        '',
        'Everything stays inside the app sandbox. No system partition is touched, no root is required, and uninstalling removes all of it.',
      ]],
      ['Build from source', [
        '```powershell',
        'tools/rebuild-apk.ps1 `',
        '  -SdkRoot  <android sdk> `',
        '  -JavaHome <jdk 21> `',
        '  -ProjectRoot restored/installed-0.2.1-android.5 `',
        '  -Abi both',
        '```',
        '',
        'For interface-only changes, push straight to a connected device:',
        '',
        '```powershell',
        'tools/sync-shell.cjs',
        '```',
        '',
        'A cold start is required afterwards — reloading the page does not re-run the pushed script.',
        '',
        'The runtime archives (`*.tar.gz`) are not in the repository because of their size; generate them with the `tools/build-*.cjs` scripts.',
      ]],
      ['Status', [
        'Current version is **0.2.1-android.5**, an early but usable build. Interface details and interaction are still being refined, so expect frequent updates.',
      ]],
    ],
  },
  ja: {
    title: 'DeepSeek Harness for Android',
    tag: 'スマートフォンだけで動く完全な DeepSeek Harness。パソコンもサーバーも外部接続も不要です。',
    secs: [
      ['これは何か', [
        'DeepSeek Harness は、モデルとの対話・ファイル操作・コマンド実行・タスク編成をひとつの会話にまとめた作業環境です。もともとはデスクトップのターミナル向けに作られています。',
        'このプロジェクトは、その実行環境をまるごと Android アプリに移しました。APK の中に Ubuntu のユーザー空間、Node ランタイム、Harness 本体が入っており、アプリ専用ディレクトリに展開して起動します。システムの他の部分とは切り離されています。',
        '画面はいつもの Harness と同じです。レイアウトと操作だけをタッチ向けに作り直しました。入力欄は親指の届く下側にあり、ポップアップが押そうとしたボタンを覆うことはありません。',
      ]],
      ['インストール', [
        '1. [Releases](https://github.com/' + REPO + '/releases) から最新の `.apk` をダウンロードします。',
        '2. 端末の設定で「提供元不明のアプリ」を許可します。',
        '3. インストールしてアイコンをタップします。',
        '',
        '初回起動では数百 MB の環境を展開するため、端末によって 1〜3 分かかります。画面に進捗が出ます。初期化は一度だけで、以降は十数秒で画面に入ります。',
      ]],
      ['動作要件', [
        '| 項目 | 要件 |',
        '| --- | --- |',
        '| Android | 8.0（API 26）以上 |',
        '| CPU | `arm64-v8a` または `x86_64` |',
        '| 空き容量 | 2 GB 以上を推奨 |',
        '| メモリ | 4 GB 以上を推奨 |',
        '',
        'APK は約 580 MB で、両方のアーキテクチャを 1 つのファイルに含みます。',
      ]],
      ['スマートフォンで動く理由', [
        'Android は通常、アプリ専用ディレクトリからのプログラム実行を禁止し、Linux の実行環境も提供しません。次の三点で回避しています。',
        '',
        '- **targetSdk 28** — アプリ専用ディレクトリからの `exec` がまだ許可されている最後のバージョン帯です。',
        '- **PRoot** — root を必要とせず、任意のディレクトリを `/` として扱えるユーザー空間の `chroot` です。',
        '- **同梱ランタイム** — Ubuntu 24.04 のルート、glibc 版 Node 24、Harness 本体をすべて APK に収めています。',
        '',
        'すべてアプリのサンドボックス内で完結します。システム領域には触れず、root も不要で、アンインストールすればすべて消えます。',
      ]],
      ['ソースからビルド', [
        '```powershell',
        'tools/rebuild-apk.ps1 `',
        '  -SdkRoot  <android sdk> `',
        '  -JavaHome <jdk 21> `',
        '  -ProjectRoot restored/installed-0.2.1-android.5 `',
        '  -Abi both',
        '```',
        '',
        '画面だけを変更した場合は、接続中の端末へ直接転送できます。',
        '',
        '```powershell',
        'tools/sync-shell.cjs',
        '```',
        '',
        '転送後はコールドスタートが必要です。ページの再読み込みではスクリプトが再実行されません。',
        '',
        'サイズが大きいため、ランタイムのアーカイブ（`*.tar.gz`）はリポジトリに含めていません。`tools/build-*.cjs` で生成してください。',
      ]],
      ['状態', [
        '現在のバージョンは **0.2.1-android.5** で、初期の実用版です。画面の細部と操作感はまだ調整中で、更新は頻繁に入ります。',
      ]],
    ],
  },
  ko: {
    title: 'DeepSeek Harness for Android',
    tag: '휴대폰에서 바로 실행되는 완전한 DeepSeek Harness. 컴퓨터도, 서버도, 외부 연결도 필요 없습니다.',
    secs: [
      ['무엇인가', [
        'DeepSeek Harness는 모델과의 대화, 파일 조작, 명령 실행, 작업 구성을 하나의 대화로 묶은 작업 환경입니다. 원래는 데스크톱 터미널용으로 만들어졌습니다.',
        '이 프로젝트는 그 실행 환경을 통째로 안드로이드 앱으로 옮겼습니다. APK 안에 우분투 사용자 공간, Node 런타임, Harness 본체가 들어 있고, 앱 전용 디렉터리에 풀어서 실행합니다. 시스템의 다른 부분과는 분리되어 있습니다.',
        '화면은 기존 Harness와 같습니다. 레이아웃과 조작 방식만 터치에 맞게 다시 만들었습니다. 입력창은 엄지가 닿는 아래쪽에 있고, 팝업이 누르려는 버튼을 가리지 않습니다.',
      ]],
      ['설치', [
        '1. [Releases](https://github.com/' + REPO + '/releases)에서 최신 `.apk`를 내려받습니다.',
        '2. 휴대폰 설정에서 알 수 없는 출처의 앱 설치를 허용합니다.',
        '3. 설치한 뒤 아이콘을 누릅니다.',
        '',
        '첫 실행에서는 수백 MB의 환경을 풀어야 하므로 기기에 따라 1~3분 걸립니다. 화면에 진행 상황이 표시됩니다. 초기화는 한 번만 일어나며, 이후에는 십여 초 안에 화면이 뜹니다.',
      ]],
      ['요구 사항', [
        '| 항목 | 요구 사항 |',
        '| --- | --- |',
        '| Android | 8.0(API 26) 이상 |',
        '| CPU | `arm64-v8a` 또는 `x86_64` |',
        '| 저장 공간 | 2 GB 이상 권장 |',
        '| 메모리 | 4 GB 이상 권장 |',
        '',
        'APK는 약 580 MB이며 두 아키텍처를 한 파일에 담고 있습니다.',
      ]],
      ['휴대폰에서 실행되는 이유', [
        '안드로이드는 기본적으로 앱 전용 디렉터리의 프로그램 실행을 막고, 리눅스 실행 환경도 제공하지 않습니다. 세 가지로 우회합니다.',
        '',
        '- **targetSdk 28** — 앱 전용 디렉터리에서 `exec`이 아직 허용되는 마지막 버전대입니다.',
        '- **PRoot** — root 없이 임의의 디렉터리를 `/`로 다루는 사용자 공간 `chroot`입니다.',
        '- **내장 런타임** — 우분투 24.04 루트, glibc Node 24, Harness 본체를 모두 APK에 넣었습니다.',
        '',
        '모든 것이 앱 샌드박스 안에서 동작합니다. 시스템 영역을 건드리지 않고 root도 필요 없으며, 앱을 삭제하면 전부 사라집니다.',
      ]],
      ['소스에서 빌드', [
        '```powershell',
        'tools/rebuild-apk.ps1 `',
        '  -SdkRoot  <android sdk> `',
        '  -JavaHome <jdk 21> `',
        '  -ProjectRoot restored/installed-0.2.1-android.5 `',
        '  -Abi both',
        '```',
        '',
        '화면만 수정했다면 연결된 기기로 바로 전송할 수 있습니다.',
        '',
        '```powershell',
        'tools/sync-shell.cjs',
        '```',
        '',
        '전송 후에는 콜드 스타트가 필요합니다. 페이지를 새로고침해도 스크립트는 다시 실행되지 않습니다.',
        '',
        '용량이 커서 런타임 아카이브(`*.tar.gz`)는 저장소에 넣지 않았습니다. `tools/build-*.cjs`로 생성하십시오.',
      ]],
      ['상태', [
        '현재 버전은 **0.2.1-android.5**이며 초기 실용 버전입니다. 화면 세부와 조작감은 아직 다듬는 중이라 업데이트가 자주 있습니다.',
      ]],
    ],
  },
  th: {
    title: 'DeepSeek Harness for Android',
    tag: 'DeepSeek Harness ตัวเต็มที่รันบนมือถือโดยตรง ไม่ต้องใช้คอมพิวเตอร์ ไม่ต้องมีเซิร์ฟเวอร์ ไม่ต้องเชื่อมต่อภายนอก',
    secs: [
      ['คืออะไร', [
        'DeepSeek Harness คือสภาพแวดล้อมการทำงานที่รวมการสนทนากับโมเดล การจัดการไฟล์ การรันคำสั่ง และการจัดงานไว้ในบทสนทนาเดียว เดิมทีถูกออกแบบมาสำหรับเทอร์มินัลบนเดสก์ท็อป',
        'โปรเจกต์นี้ย้ายสภาพแวดล้อมการทำงานทั้งหมดเข้ามาอยู่ในแอปแอนดรอยด์ APK มีทั้งระบบผู้ใช้ Ubuntu แบบย่อ รันไทม์ Node และตัว Harness เอง ทั้งหมดถูกคลายออกไปยังไดเรกทอรีส่วนตัวของแอปและเริ่มทำงานจากที่นั่น แยกจากส่วนอื่นของระบบ',
        'หน้าจอเป็นชุดเดียวกับที่คุ้นเคย มีเพียงเลย์เอาต์และวิธีควบคุมที่ทำใหม่ให้เหมาะกับการสัมผัส ช่องพิมพ์อยู่ด้านล่างในระยะนิ้วโป้ง และป๊อปอัปจะไม่บังปุ่มที่กำลังจะกด',
      ]],
      ['การติดตั้ง', [
        '1. ดาวน์โหลด `.apk` เวอร์ชันล่าสุดจาก [Releases](https://github.com/' + REPO + '/releases)',
        '2. อนุญาตให้ติดตั้งจากแหล่งที่ไม่รู้จักในเครื่อง',
        '3. ติดตั้งแล้วแตะไอคอน',
        '',
        'การเปิดครั้งแรกจะคลายไฟล์หลายร้อยเมกะไบต์ลงในไดเรกทอรีของแอป ใช้เวลาหนึ่งถึงสามนาทีขึ้นอยู่กับเครื่อง หน้าจอจะแสดงความคืบหน้า ทำเพียงครั้งเดียว ครั้งต่อไปเข้าสู่หน้าจอได้ภายในไม่กี่วินาที',
      ]],
      ['ข้อกำหนด', [
        '| รายการ | ข้อกำหนด |',
        '| --- | --- |',
        '| Android | 8.0 (API 26) ขึ้นไป |',
        '| CPU | `arm64-v8a` หรือ `x86_64` |',
        '| พื้นที่ว่าง | แนะนำ 2 GB ขึ้นไป |',
        '| หน่วยความจำ | แนะนำ 4 GB ขึ้นไป |',
        '',
        'ไฟล์ APK มีขนาดประมาณ 580 MB และรองรับทั้งสองสถาปัตยกรรมในไฟล์เดียว',
      ]],
      ['ทำไมจึงรันบนมือถือได้', [
        'โดยปกติแอนดรอยด์ไม่อนุญาตให้รันโปรแกรมจากไดเรกทอรีของแอป และไม่มีสภาพแวดล้อมลินุกซ์ให้ใช้ โปรเจกต์นี้เลี่ยงด้วยสามอย่าง',
        '',
        '- **targetSdk 28** — ช่วงเวอร์ชันสุดท้ายที่ยังอนุญาตให้ `exec` จากไดเรกทอรีส่วนตัวของแอป',
        '- **PRoot** — `chroot` ในพื้นที่ผู้ใช้ที่ไม่ต้องมี root และทำให้ไดเรกทอรีใดๆ ทำงานเหมือน `/`',
        '- **รันไทม์ที่บรรจุมาด้วย** — รูท Ubuntu 24.04 แบบย่อ, Node 24 เวอร์ชัน glibc และโค้ด Harness ทั้งหมดอยู่ใน APK',
        '',
        'ทุกอย่างทำงานในแซนด์บ็อกซ์ของแอป ไม่แตะพาร์ทิชันระบบ ไม่ต้องมี root และเมื่อถอนการติดตั้งก็หายทั้งหมด',
      ]],
      ['สร้างจากซอร์ส', [
        '```powershell',
        'tools/rebuild-apk.ps1 `',
        '  -SdkRoot  <android sdk> `',
        '  -JavaHome <jdk 21> `',
        '  -ProjectRoot restored/installed-0.2.1-android.5 `',
        '  -Abi both',
        '```',
        '',
        'หากแก้เฉพาะหน้าจอ สามารถส่งไปยังเครื่องที่เชื่อมต่อได้ทันที',
        '',
        '```powershell',
        'tools/sync-shell.cjs',
        '```',
        '',
        'หลังจากส่งแล้วต้องปิดแอปแล้วเปิดใหม่ การรีเฟรชหน้าไม่ทำให้สคริปต์ทำงานใหม่',
        '',
        'ไฟล์archive ของรันไทม์ (`*.tar.gz`) ไม่ได้อยู่ในรีโปเพราะมีขนาดใหญ่ ให้สร้างด้วยสคริปต์ `tools/build-*.cjs`',
      ]],
      ['สถานะ', [
        'เวอร์ชันปัจจุบันคือ **0.2.1-android.5** เป็นเวอร์ชันใช้งานได้ในช่วงต้น รายละเอียดหน้าจอและการตอบสนองยังอยู่ระหว่างการปรับปรุง จึงมีการอัปเดตบ่อย',
      ]],
    ],
  },
  pt: {
    title: 'DeepSeek Harness for Android',
    tag: 'O DeepSeek Harness completo, rodando no seu celular. Sem computador, sem servidor, sem conexão externa.',
    secs: [
      ['O que é', [
        'DeepSeek Harness é um ambiente de trabalho que reúne conversa com o modelo, acesso a arquivos, execução de comandos e orquestração de tarefas em uma única conversa. Foi criado para o terminal do desktop.',
        'Este projeto move o ambiente inteiro para dentro de um aplicativo Android. O APK carrega um espaço de usuário Ubuntu enxuto, um runtime Node e o próprio Harness. Eles são extraídos para o diretório privado do aplicativo e iniciam dali, isolados do resto do sistema.',
        'A interface é a mesma que você conhece. Apenas o layout e os controles foram refeitos para o toque: o campo de entrada fica embaixo, ao alcance do polegar, e os menus nunca cobrem o botão que você vai pressionar.',
      ]],
      ['Instalação', [
        '1. Baixe o `.apk` mais recente em [Releases](https://github.com/' + REPO + '/releases).',
        '2. Permita a instalação de fontes desconhecidas no aparelho.',
        '3. Instale e toque no ícone.',
        '',
        'A primeira inicialização extrai algumas centenas de megabytes no diretório do aplicativo e leva de um a três minutos, dependendo do aparelho. A tela mostra o progresso. Isso acontece uma única vez; as próximas aberturas chegam à interface em segundos.',
      ]],
      ['Requisitos', [
        '| Item | Requisito |',
        '| --- | --- |',
        '| Android | 8.0 (API 26) ou superior |',
        '| CPU | `arm64-v8a` ou `x86_64` |',
        '| Armazenamento | 2 GB livres recomendados |',
        '| Memória | 4 GB recomendados |',
        '',
        'O APK tem cerca de 580 MB e atende as duas arquiteturas em um único arquivo.',
      ]],
      ['Por que funciona no celular', [
        'O Android normalmente proíbe executar programas do diretório do próprio aplicativo e não oferece um ambiente Linux. Três coisas contornam isso:',
        '',
        '- **targetSdk 28** — a última faixa de versão que ainda permite `exec` do diretório privado.',
        '- **PRoot** — um `chroot` em espaço de usuário, sem root, que faz qualquer diretório se comportar como `/`.',
        '- **Runtime embarcado** — raiz Ubuntu 24.04 enxuta, Node 24 glibc e o código do Harness, tudo dentro do APK.',
        '',
        'Tudo permanece dentro do sandbox do aplicativo. Nenhuma partição do sistema é alterada, não é preciso root, e desinstalar remove tudo.',
      ]],
      ['Compilar do código-fonte', [
        '```powershell',
        'tools/rebuild-apk.ps1 `',
        '  -SdkRoot  <android sdk> `',
        '  -JavaHome <jdk 21> `',
        '  -ProjectRoot restored/installed-0.2.1-android.5 `',
        '  -Abi both',
        '```',
        '',
        'Para mudanças apenas na interface, envie direto para um aparelho conectado:',
        '',
        '```powershell',
        'tools/sync-shell.cjs',
        '```',
        '',
        'É necessário reiniciar o aplicativo depois — recarregar a página não reexecuta o script enviado.',
        '',
        'Os arquivos do runtime (`*.tar.gz`) não estão no repositório por causa do tamanho; gere-os com os scripts `tools/build-*.cjs`.',
      ]],
      ['Estado', [
        'A versão atual é **0.2.1-android.5**, uma compilação inicial porém utilizável. Detalhes de interface e interação ainda estão sendo refinados, então espere atualizações frequentes.',
      ]],
    ],
  },
  es: {
    title: 'DeepSeek Harness for Android',
    tag: 'El DeepSeek Harness completo, ejecutándose en tu teléfono. Sin ordenador, sin servidor, sin conexión externa.',
    secs: [
      ['Qué es', [
        'DeepSeek Harness es un entorno de trabajo que reúne la conversación con el modelo, el acceso a archivos, la ejecución de comandos y la orquestación de tareas en una sola conversación. Se creó para la terminal de escritorio.',
        'Este proyecto traslada todo el entorno a una aplicación Android. El APK incluye un espacio de usuario Ubuntu reducido, un runtime de Node y el propio Harness. Se descomprimen en el directorio privado de la aplicación y arrancan desde ahí, aislados del resto del sistema.',
        'La interfaz es la misma que conoces. Solo la disposición y los controles se rehicieron para el tacto: el campo de entrada está abajo, al alcance del pulgar, y los menús nunca tapan el botón que vas a pulsar.',
      ]],
      ['Instalación', [
        '1. Descarga el `.apk` más reciente desde [Releases](https://github.com/' + REPO + '/releases).',
        '2. Permite la instalación desde orígenes desconocidos en el teléfono.',
        '3. Instálalo y pulsa el icono.',
        '',
        'El primer arranque descomprime varios cientos de megabytes en el directorio de la aplicación y tarda entre uno y tres minutos según el dispositivo. La pantalla muestra el progreso. Solo ocurre una vez; los siguientes arranques llegan a la interfaz en segundos.',
      ]],
      ['Requisitos', [
        '| Elemento | Requisito |',
        '| --- | --- |',
        '| Android | 8.0 (API 26) o superior |',
        '| CPU | `arm64-v8a` o `x86_64` |',
        '| Almacenamiento | 2 GB libres recomendados |',
        '| Memoria | 4 GB recomendados |',
        '',
        'El APK pesa unos 580 MB y cubre ambas arquitecturas en un solo archivo.',
      ]],
      ['Por qué funciona en el teléfono', [
        'Android normalmente prohíbe ejecutar programas desde el directorio de la propia aplicación y no ofrece un entorno Linux. Tres cosas lo sortean:',
        '',
        '- **targetSdk 28** — la última franja de versiones que aún permite `exec` desde el directorio privado.',
        '- **PRoot** — un `chroot` en espacio de usuario, sin root, que hace que cualquier directorio se comporte como `/`.',
        '- **Runtime incluido** — raíz Ubuntu 24.04 reducida, Node 24 glibc y el código del Harness, todo dentro del APK.',
        '',
        'Todo permanece dentro del sandbox de la aplicación. No se toca ninguna partición del sistema, no hace falta root, y desinstalar lo elimina todo.',
      ]],
      ['Compilar desde el código', [
        '```powershell',
        'tools/rebuild-apk.ps1 `',
        '  -SdkRoot  <android sdk> `',
        '  -JavaHome <jdk 21> `',
        '  -ProjectRoot restored/installed-0.2.1-android.5 `',
        '  -Abi both',
        '```',
        '',
        'Para cambios solo de interfaz, envía directamente a un dispositivo conectado:',
        '',
        '```powershell',
        'tools/sync-shell.cjs',
        '```',
        '',
        'Después hay que reiniciar la aplicación: recargar la página no vuelve a ejecutar el script enviado.',
        '',
        'Los archivos del runtime (`*.tar.gz`) no están en el repositorio por su tamaño; genéralos con los scripts `tools/build-*.cjs`.',
      ]],
      ['Estado', [
        'La versión actual es **0.2.1-android.5**, una compilación temprana pero utilizable. Los detalles de interfaz y la interacción todavía se están puliendo, así que habrá actualizaciones frecuentes.',
      ]],
    ],
  },
  fr: {
    title: 'DeepSeek Harness for Android',
    tag: 'Le DeepSeek Harness complet, exécuté sur votre téléphone. Sans ordinateur, sans serveur, sans connexion externe.',
    secs: [
      ['Ce que c\'est', [
        'DeepSeek Harness est un environnement de travail qui réunit la conversation avec le modèle, l\'accès aux fichiers, l\'exécution de commandes et l\'orchestration des tâches dans une seule conversation. Il a été conçu pour le terminal d\'un ordinateur de bureau.',
        'Ce projet déplace l\'ensemble de l\'environnement dans une application Android. L\'APK embarque un espace utilisateur Ubuntu allégé, un runtime Node et Harness lui-même. Ils sont extraits dans le répertoire privé de l\'application et démarrent là, isolés du reste du système.',
        'L\'interface est celle que vous connaissez. Seule la disposition et les commandes ont été refaites pour le tactile : le champ de saisie est en bas, à portée de pouce, et les menus ne recouvrent jamais le bouton que vous allez toucher.',
      ]],
      ['Installation', [
        '1. Téléchargez le dernier `.apk` depuis [Releases](https://github.com/' + REPO + '/releases).',
        '2. Autorisez l\'installation depuis des sources inconnues sur le téléphone.',
        '3. Installez, puis touchez l\'icône.',
        '',
        'Le premier démarrage extrait plusieurs centaines de mégaoctets dans le répertoire de l\'application et prend une à trois minutes selon l\'appareil. L\'écran affiche la progression. Cela n\'arrive qu\'une fois ; les démarrages suivants atteignent l\'interface en quelques secondes.',
      ]],
      ['Configuration requise', [
        '| Élément | Exigence |',
        '| --- | --- |',
        '| Android | 8.0 (API 26) ou supérieur |',
        '| CPU | `arm64-v8a` ou `x86_64` |',
        '| Stockage | 2 Go libres recommandés |',
        '| Mémoire | 4 Go recommandés |',
        '',
        'L\'APK pèse environ 580 Mo et couvre les deux architectures dans un seul fichier.',
      ]],
      ['Pourquoi cela tourne sur un téléphone', [
        'Android interdit normalement d\'exécuter des programmes depuis le répertoire de l\'application et ne fournit pas d\'environnement Linux. Trois éléments contournent cela :',
        '',
        '- **targetSdk 28** — la dernière plage de versions qui autorise encore `exec` depuis le répertoire privé.',
        '- **PRoot** — un `chroot` en espace utilisateur, sans root, qui fait qu\'un répertoire se comporte comme `/`.',
        '- **Un runtime embarqué** — racine Ubuntu 24.04 allégée, Node 24 glibc et le code de Harness, le tout dans l\'APK.',
        '',
        'Tout reste dans le bac à sable de l\'application. Aucune partition système n\'est modifiée, aucun root n\'est requis, et la désinstallation efface tout.',
      ]],
      ['Compiler depuis les sources', [
        '```powershell',
        'tools/rebuild-apk.ps1 `',
        '  -SdkRoot  <android sdk> `',
        '  -JavaHome <jdk 21> `',
        '  -ProjectRoot restored/installed-0.2.1-android.5 `',
        '  -Abi both',
        '```',
        '',
        'Pour des changements d\'interface uniquement, poussez directement vers un appareil connecté :',
        '',
        '```powershell',
        'tools/sync-shell.cjs',
        '```',
        '',
        'Un démarrage à froid est nécessaire ensuite — recharger la page ne réexécute pas le script poussé.',
        '',
        'Les archives du runtime (`*.tar.gz`) ne sont pas dans le dépôt en raison de leur taille ; générez-les avec les scripts `tools/build-*.cjs`.',
      ]],
      ['État', [
        'La version actuelle est **0.2.1-android.5**, une compilation précoce mais utilisable. Les détails d\'interface et les interactions sont encore en cours de finition, attendez-vous donc à des mises à jour fréquentes.',
      ]],
    ],
  },
};

const written = [];
for (const [code, page] of Object.entries(pages)) {
  const body = [
    `# ${page.title}`,
    '',
    page.tag,
    '',
    nav(code),
    '',
    '---',
    '',
    badges,
    '',
    ...page.secs.flatMap(([heading, lines]) => [`## ${heading}`, '', ...lines, '']),
    '---',
    '',
    nav(code),
    '',
  ].join('\n');
  const file = path.join(dir, `README.${code}.md`);
  fs.writeFileSync(file, body, 'utf8');
  written.push(`README.${code}.md`);
}

// language bar for the Chinese master file
const zhNav = '**简体中文 · [English](docs/i18n/README.en.md) · [日本語](docs/i18n/README.ja.md) · [한국어](docs/i18n/README.ko.md) · [ไทย](docs/i18n/README.th.md) · [Português](docs/i18n/README.pt.md) · [Español](docs/i18n/README.es.md) · [Français](docs/i18n/README.fr.md)**';

const readme = path.join(root, 'README.md');
let s = fs.readFileSync(readme, 'utf8');
if (!s.includes('docs/i18n/README.en.md')) {
  s = s.replace(/\n---\n\n## 目录/, `\n${zhNav}\n\n---\n\n## 目录`);
  if (!s.includes('docs/i18n/README.en.md')) {
    // fall back: insert right after the tagline
    s = s.replace(
      '不需要连任何外部地址。装好之后点图标就能用。',
      '不需要连任何外部地址。装好之后点图标就能用。\n\n' + zhNav,
    );
  }
  fs.writeFileSync(readme, s, 'utf8');
}

console.log(JSON.stringify({ written, zhNav: s.includes('docs/i18n/README.en.md') }));
