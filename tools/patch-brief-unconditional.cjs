// Run the patch writer unconditionally at the start of install(), with a visible
// error message instead of a silent catch.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(
  __dirname, '..', 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java',
  'com', 'deepseek', 'harness', 'android', 'RuntimeInstaller.java',
);
let src = fs.readFileSync(f, 'utf8');

// 1. remove the call from the early-return try block
src = src.replace(
  `            try {
                termuxIdentity(context, root);
                appEnvironmentBrief(root);
            } catch (Exception ignored) {
            }`,
  `            try {
                termuxIdentity(context, root);
            } catch (Exception e) {
                progress.update("Termux 身份写入失败：" + e.getMessage());
            }`,
);

// 2. insert an unconditional call at the top of install()
const anchor = `    static void install(Context context, Progress progress) throws Exception {
        File root = root(context);`;
const withCall = `    static void install(Context context, Progress progress) throws Exception {
        File root = root(context);
        try {
            appEnvironmentBrief(root);
        } catch (Exception e) {
            progress.update("环境提示词写入失败：" + e.getMessage());
        }`;
if (!src.includes(anchor)) {
  console.error('install anchor not found');
  process.exit(1);
}
src = src.replace(anchor, withCall);

fs.writeFileSync(f, src, 'utf8');

const count = (src.match(/appEnvironmentBrief\(root\)/g) || []).length;
const early = src.includes('            } catch (Exception ignored) {\n            }');
console.log(JSON.stringify({ calls: count, silentCatchGone: !early }));
