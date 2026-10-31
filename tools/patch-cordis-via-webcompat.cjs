// Ship the cordis patch as an asset and have installWebCompat copy it, the same
// channel that already reliably installs android-mobile.js.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const P = path.join(ROOT, 'restored', 'installed-0.2.1-android.5');
const assets = path.join(P, 'app', 'src', 'main', 'assets');
const javaPath = path.join(P, 'app', 'src', 'main', 'java', 'com', 'deepseek', 'harness', 'android', 'RuntimeInstaller.java');

// 1. write the patch as an asset
const lines = [
  '- id: workspace-controller',
  '  config:',
  '    documentsDirectory: /root/workspace',
  '- id: system-prompt',
  '  config:',
  '    personaPrefix: |',
  '      你在 Android 手机上的 DeepSeek Harness 安卓版中运行，不是桌面 Linux，也不是云服务器。',
  '      环境身份是 Termux（Android 终端环境）：cat /etc/os-release 显示 Termux，shell 为 bash 5.3.20。',
  '      命令实际执行在 PRoot 提供的 glibc 用户态中（为了运行 Node.js 及其原生模块），',
  '      因此 uname -a、/proc 等会显示 Linux 宿主信息，这是正常的，不要据此认为自己在普通服务器上。',
  '      包管理用 apt（pkg 已映射到 apt）；PREFIX 指向应用私有目录下的 Termux 根。',
  '      工作目录默认 /root/workspace。网络出口是手机自身网络，没有公网 IP。',
  '',
];
fs.writeFileSync(path.join(assets, 'android.cordis.patch.yml'), lines.join('\n'), 'utf8');

// 2. extend installWebCompat's copy list with it
let java = fs.readFileSync(javaPath, 'utf8');
const oldArr = `        String[] strArr = {"android-web-compat.js", "android-abort-compat.js", "android-mobile.css", "android-mobile.js"};
        for (int i = 0; i < 4; i++) {`;
const newArr = `        String[] strArr = {"android-web-compat.js", "android-abort-compat.js", "android-mobile.css", "android-mobile.js", "android.cordis.patch.yml"};
        for (int i = 0; i < strArr.length; i++) {`;
if (!java.includes(oldArr)) {
  console.error('webCompat copy loop not found');
  process.exit(1);
}
java = java.replace(oldArr, newArr);

// 3. after copying web assets, also place the patch where the engine reads it
const anchor = `    static void installWebCompat(Context context) throws Exception {
        configureNetwork(context);`;
const withPatch = `    static void installWebCompat(Context context) throws Exception {
        configureNetwork(context);
        try {
            File patchOut = new File(root(context), "opt/harness/android.cordis.patch.yml");
            patchOut.getParentFile().mkdirs();
            InputStream patchIn = context.getAssets().open("android.cordis.patch.yml");
            try {
                FileOutputStream patchOs = new FileOutputStream(patchOut);
                try {
                    byte[] buf = new byte[8192];
                    int n;
                    while ((n = patchIn.read(buf)) != -1) {
                        patchOs.write(buf, 0, n);
                    }
                } finally {
                    patchOs.close();
                }
            } finally {
                patchIn.close();
            }
        } catch (Exception ignored) {
        }`;
if (!java.includes(anchor)) {
  console.error('installWebCompat anchor not found');
  process.exit(1);
}
java = java.replace(anchor, withPatch);

fs.writeFileSync(javaPath, java, 'utf8');
console.log(
  JSON.stringify({
    assetWritten: fs.existsSync(path.join(assets, 'android.cordis.patch.yml')),
    copyLoopExtended: java.includes('"android.cordis.patch.yml"}'),
    patchWriterAdded: java.includes('patchOut.getParentFile().mkdirs()'),
  }),
);
