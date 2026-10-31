// Replace the AGENTS.md approach with the real thing: the system-prompt
// personaPrefix, injected through the cordis patch file the app already loads.
const fs = require('node:fs');
const path = require('node:path');

const javaPath = path.join(
  __dirname, '..', 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java',
  'com', 'deepseek', 'harness', 'android', 'RuntimeInstaller.java',
);
let java = fs.readFileSync(javaPath, 'utf8');

// 1. drop the AGENTS.md helper body and rewrite it as the patch writer
const start = java.indexOf('    /** 告诉模型它真实所处的环境。 */');
if (start < 0) {
  console.error('env brief helper not found');
  process.exit(1);
}
const endMarker = '    static ProcessBuilder command(Context context, String... strArr) throws Exception {';
const end = java.indexOf(endMarker);
if (end < 0 || end <= start) {
  console.error('command anchor not found');
  process.exit(1);
}

const persona = [
  '你在 Android 手机上的 DeepSeek Harness 安卓版中运行，不是桌面 Linux，也不是云服务器。',
  '环境身份是 Termux（Android 终端环境）：cat /etc/os-release 显示 Termux，shell 为 bash 5.3.20。',
  '命令实际执行在 PRoot 提供的 glibc 用户态中（为了运行 Node.js 及其原生模块），',
  '因此 uname -a、/proc 等会显示 Linux 宿主信息，这是正常的，不要据此认为自己在普通服务器上。',
  '包管理用 apt（pkg 已映射到 apt）；$PREFIX 指向应用私有目录下的 Termux 根。',
  '工作目录默认 /root/workspace。网络出口是手机自身网络，没有公网 IP。',
];

const yamlLines = [
  '- id: workspace-controller',
  '  config:',
  '    documentsDirectory: /root/workspace',
  '- id: system-prompt',
  '  config:',
  '    personaPrefix: |',
  ...persona.map((l) => '      ' + l),
];

const literal = yamlLines.map((l) => `                "${l.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}\\n"`).join(' +\n');

const replacement = `    /** 把运行环境写进系统提示词（personaPrefix），而不是仅靠 AGENTS.md。 */
    static void appEnvironmentBrief(File root) throws Exception {
        File harnessDir = new File(root, "opt/harness");
        harnessDir.mkdirs();
        write(new File(harnessDir, "android.cordis.patch.yml"),
${literal});
    }

`;

java = java.slice(0, start) + replacement + java.slice(end);

fs.writeFileSync(javaPath, java, 'utf8');
console.log(
  JSON.stringify({
    patchWriter: java.includes('android.cordis.patch.yml'),
    personaLines: persona.length,
    agentsMdGone: !java.includes('AGENTS.md'),
    calls: (java.match(/appEnvironmentBrief\(root\)/g) || []).length,
  }),
);
