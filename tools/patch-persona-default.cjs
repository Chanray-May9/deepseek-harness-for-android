// Root fix: change the default personaPrefix inside dsh-system-prompt itself,
// so the environment brief is part of every system prompt without re-registering.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(
  __dirname, '..', 'restored', 'installed-0.2.1-android.5', 'runtime',
  'node_modules', '@deepseek-ai', 'dsh-system-prompt', 'lib', 'index.js',
);
let src = fs.readFileSync(f, 'utf8');

const marker = 'personaPrefix: z.string().default(""),';
if (!src.includes(marker)) {
  const already = src.includes('Android 手机上的 DeepSeek Harness');
  console.log(JSON.stringify({ markerFound: false, alreadyPatched: already }));
  process.exit(already ? 0 : 1);
}

const persona = [
  '你在 Android 手机上的 DeepSeek Harness 安卓版中运行，不是桌面 Linux，也不是云服务器。',
  '环境身份是 Termux（Android 终端环境）：cat /etc/os-release 显示 Termux，shell 为 bash 5.3.20。',
  '命令实际执行在 PRoot 提供的 glibc 用户态中（为了运行 Node.js 及其原生模块），',
  '因此 uname -a、/proc 等会显示 Linux 宿主信息，这是正常的，不要据此认为自己在普通服务器上。',
  '包管理用 apt（pkg 已映射到 apt）；PREFIX 指向应用私有目录下的 Termux 根。',
  '工作目录默认 /root/workspace。网络出口是手机自身网络，没有公网 IP。',
].join('\\n');

const replacement = `personaPrefix: z.string().default("${persona.replace(/"/g, '\\"')}"),`;
src = src.replace(marker, replacement);
fs.writeFileSync(f, src, 'utf8');

console.log(JSON.stringify({ replaced: true, bytes: src.length, containsBrief: src.includes('Android 手机上的 DeepSeek Harness') }));
