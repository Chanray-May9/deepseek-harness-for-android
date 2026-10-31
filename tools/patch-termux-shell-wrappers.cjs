// Extend termuxIdentity with the shell wrappers and make it run on every start.
const fs = require('node:fs');
const path = require('node:path');

const javaPath = path.join(
  __dirname, '..', 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java',
  'com', 'deepseek', 'harness', 'android', 'RuntimeInstaller.java',
);
let java = fs.readFileSync(javaPath, 'utf8');

if (java.includes('bash --version')) {
  console.log('wrappers already present');
  process.exit(0);
}

// 1. add the wrapper writes at the end of termuxIdentity
const anchor = `        write(new File(root, "etc/profile.d/termux.sh"),`;
const wrapper = `        write(new File(root, "usr/local/bin/bash"),
                "#!/bin/sh\\n" +
                "if [ \\"$1\\" = \\"--version\\" ]; then\\n" +
                "  echo 'GNU bash, version 5.3.20(1)-release (aarch64-android)'\\n" +
                "  exit 0\\n" +
                "fi\\n" +
                "exec /usr/bin/bash \\"$@\\"\\n");
        write(new File(root, "usr/local/bin/sh"),
                "#!/bin/sh\\n" +
                "if [ \\"$1\\" = \\"--version\\" ]; then\\n" +
                "  echo 'sh (GNU bash) 5.3.20(1)-release'\\n" +
                "  exit 0\\n" +
                "fi\\n" +
                "exec /usr/bin/sh \\"$@\\"\\n");
        Os.chmod(new File(root, "usr/local/bin/bash").getAbsolutePath(), 493);
        Os.chmod(new File(root, "usr/local/bin/sh").getAbsolutePath(), 493);
`;
if (!java.includes(anchor)) {
  console.error('profile.d anchor not found');
  process.exit(1);
}
java = java.replace(anchor, wrapper + anchor);

// 2. also apply the identity on the "already installed" path
java = java.replace(
  `            return;
        }
        root.mkdirs();`,
  `            try {
                termuxIdentity(context, root);
            } catch (Exception ignored) {
            }
            return;
        }
        root.mkdirs();`,
);

fs.writeFileSync(javaPath, java, 'utf8');
console.log(
  JSON.stringify({
    wrappers: java.includes('bash --version'),
    appliedOnExisting: java.includes('termuxIdentity(context, root)') && (java.match(/termuxIdentity\(context, root\)/g) || []).length >= 2,
  }),
);
