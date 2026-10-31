// Make the dsh terminal present itself as Termux: os-release, PREFIX, pkg,
// termux-info, and the shell prompt.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const javaPath = path.join(
  ROOT, 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java',
  'com', 'deepseek', 'harness', 'android', 'RuntimeInstaller.java',
);
let java = fs.readFileSync(javaPath, 'utf8');

if (java.includes('termuxIdentity')) {
  console.log('already present');
  process.exit(0);
}

// 1. write the Termux identity files right after the base filesystem is ready
const anchor = `        write(new File(root, "root/.hushlogin"), "");`;
const block = `        write(new File(root, "root/.hushlogin"), "");
        termuxIdentity(context, root);
`;
if (!java.includes(anchor)) {
  console.error('hushlogin anchor not found');
  process.exit(1);
}
java = java.replace(anchor, block);

// 2. add the helper that writes the identity, plus the shell env
const helperAnchor = `    static ProcessBuilder command(Context context, String... strArr) throws Exception {`;
const helper = `    /**
     * dsh 的终端跑在 glibc 的 PRoot 里，无法执行 bionic 的 Termux 二进制，
     * 所以把环境身份做成 Termux：/etc/os-release、PREFIX、pkg、termux-info。
     */
    static void termuxIdentity(Context context, File root) throws Exception {
        String prefix = new File(context.getFilesDir(), "usr").getAbsolutePath();
        write(new File(root, "etc/os-release"),
                "PRETTY_NAME=\\"Termux\\"\\n" +
                "NAME=\\"Termux\\"\\n" +
                "ID=termux\\n" +
                "ID_LIKE=android\\n" +
                "VERSION_ID=0.118.0\\n" +
                "HOME_URL=\\"https://termux.dev/\\"\\n" +
                "SUPPORT_URL=\\"https://termux.dev/\\"\\n");
        write(new File(root, "etc/termux-version"), "TERMUX_VERSION=0.118.0\\nPREFIX=" + prefix + "\\n");
        write(new File(root, "usr/local/bin/termux-info"),
                "#!/bin/sh\\n" +
                "echo \\"Termux 0.118.0\\"\\n" +
                "echo \\"Android $(getprop ro.build.version.release 2>/dev/null)\\"\\n" +
                "echo \\"PREFIX=" + prefix + "\\"\\n" +
                "echo \\"Host: $(uname -m) (inside PRoot Ubuntu for Node.js)\\"\\n");
        write(new File(root, "usr/local/bin/pkg"),
                "#!/bin/sh\\n" +
                "echo \\"Termux 包管理在 proot 内不可用；此环境使用 apt。\\" >&2\\n" +
                "exec apt \\"$@\\"\\n");
        Os.chmod(new File(root, "usr/local/bin/termux-info").getAbsolutePath(), 493);
        Os.chmod(new File(root, "usr/local/bin/pkg").getAbsolutePath(), 493);
        write(new File(root, "etc/profile.d/termux.sh"),
                "export PREFIX=" + prefix + "\\n" +
                "export TERMUX_VERSION=0.118.0\\n" +
                "export PS1='\\\\[\\\\e[0;32m\\\\]~\\\\[\\\\e[0m\\\\] '\\n");
    }

`;
if (!java.includes(helperAnchor)) {
  console.error('command anchor not found');
  process.exit(1);
}
java = java.replace(helperAnchor, helper + helperAnchor);

// 3. expose PREFIX / TERMUX_VERSION to every dsh process
java = java.replace(
  `"DSH_HOME=/root/.dsh", "SHELL=/bin/bash");`,
  `"DSH_HOME=/root/.dsh", "SHELL=/bin/bash", "TERMUX_VERSION=0.118.0", "PREFIX=" + new File(context.getFilesDir(), "usr").getAbsolutePath());`,
);

fs.writeFileSync(javaPath, java, 'utf8');
console.log(
  JSON.stringify({
    identityInjected: java.includes('termuxIdentity(context, root)'),
    envHasPrefix: java.includes('"PREFIX=" + new File(context.getFilesDir(), "usr")'),
    helperPresent: java.includes('static void termuxIdentity'),
  }),
);
