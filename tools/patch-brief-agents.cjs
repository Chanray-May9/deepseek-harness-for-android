// Environment brief via AGENTS.md in DSH_HOME (safe: no prompt re-registration).
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(
  __dirname, '..', 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java',
  'com', 'deepseek', 'harness', 'android', 'RuntimeInstaller.java',
);
let src = fs.readFileSync(f, 'utf8');

const start = src.indexOf('    /** 把运行环境写进系统提示词');
const end = src.indexOf('    static ProcessBuilder command(Context context, String... strArr) throws Exception {');
if (start < 0 || end <= start) {
  console.error('appEnvironmentBrief block not found');
  process.exit(1);
}

const lines = [
  '# 运行环境',
  '',
  '- 你在 Android 手机上的 DeepSeek Harness 安卓版里运行，不是桌面 Linux，也不是云服务器。',
  '- 对外环境身份是 Termux 0.118.0（Android 终端环境）：cat /etc/os-release 显示 Termux，shell 为 bash 5.3.20。',
  '- 实际命令执行发生在 PRoot 提供的 glibc 用户态中（为了运行 Node.js 及其原生模块），',
  '  因此 uname -a、/proc 会显示 Linux 宿主信息，这是正常的，不要据此认为自己在普通服务器上。',
  '- 包管理用 apt（pkg 已映射到 apt）；PREFIX 指向应用私有目录下的 Termux 根。',
  '- 工作目录默认 /root/workspace。网络出口是手机自身网络，没有公网 IP。',
  '',
];
const literal = lines.map((l) => `                "${l.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}\\n"`).join(' +\n');

const replacement = `    /** 运行环境说明，写入 DSH_HOME/AGENTS.md（不触碰系统提示词注册表）。 */
    static void appEnvironmentBrief(File root) throws Exception {
        File dshHome = new File(root, "root/.dsh");
        dshHome.mkdirs();
        write(new File(dshHome, "AGENTS.md"),
${literal});
    }

`;

src = src.slice(0, start) + replacement + src.slice(end);
fs.writeFileSync(f, src, 'utf8');
console.log(JSON.stringify({ written: src.includes('AGENTS.md'), patchWriterGone: !src.includes('android.cordis.patch.yml'), calls: (src.match(/appEnvironmentBrief\(root\)/g) || []).length }));
