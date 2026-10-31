// Give the model an environment brief via AGENTS.md inside DSH_HOME.
const fs = require('node:fs');
const path = require('node:path');

const javaPath = path.join(
  __dirname, '..', 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java',
  'com', 'deepseek', 'harness', 'android', 'RuntimeInstaller.java',
);
let java = fs.readFileSync(javaPath, 'utf8');

if (java.includes('appEnvironmentBrief')) {
  console.log('already present');
  process.exit(0);
}

const lines = [
  '# 运行环境',
  '',
  '- 你在 Android 手机上的 DeepSeek Harness 安卓版里运行，不是桌面 Linux，也不是云服务器。',
  '- 对外环境身份是 Termux 0.118.0（Android 终端环境）：cat /etc/os-release 会显示 Termux。',
  '- shell 是 bash 5.3.20；工作目录默认 /root/workspace。',
  '- 实际命令执行发生在 PRoot 提供的 glibc 用户态中（为了运行 Node.js 24 及其原生模块），',
  '  因此 uname -a、/proc 等会显示 Linux 宿主信息，这属于正常现象。',
  '- 包管理用 apt；pkg 已映射到 apt。',
  '- $PREFIX 指向应用私有目录下的 Termux 根（files/usr）。',
  '- 网络出口是手机自身的网络；没有公网 IP，不要假设可以监听外网端口。',
  '',
];

const javaStringLiteral = lines
  .map((l) => `                "${l.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}\\n"`)
  .join(' +\n');

const anchor = `    static ProcessBuilder command(Context context, String... strArr) throws Exception {`;
const helper = `    /** 告诉模型它真实所处的环境。 */
    static void appEnvironmentBrief(File root) throws Exception {
        File dshHome = new File(root, "root/.dsh");
        dshHome.mkdirs();
        write(new File(dshHome, "AGENTS.md"),
${javaStringLiteral});
    }

`;
if (!java.includes(anchor)) {
  console.error('command anchor not found');
  process.exit(1);
}
java = java.replace(anchor, helper + anchor);
java = java.split('termuxIdentity(context, root);').join('termuxIdentity(context, root);\n                appEnvironmentBrief(root);');

fs.writeFileSync(javaPath, java, 'utf8');
console.log(
  JSON.stringify({
    helper: java.includes('appEnvironmentBrief'),
    calls: (java.match(/appEnvironmentBrief\(root\)/g) || []).length,
  }),
);
