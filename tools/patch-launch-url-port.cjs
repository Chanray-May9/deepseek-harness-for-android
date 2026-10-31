// The launch URL must not be matched against the guessed port: dsh may bind a
// different one, and then launchUrl stays null forever ("connection is slow").
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(
  __dirname, '..', 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java',
  'com', 'deepseek', 'harness', 'android', 'RuntimeService.java',
);
let src = fs.readFileSync(f, 'utf8');

const oldPat = 'Pattern compile = Pattern.compile("https?://127\\\\.0\\\\.0\\\\.1:" + port + "/[^\\\\s\\\\u001B]*");';
const newPat = 'Pattern compile = Pattern.compile("https?://127\\\\.0\\\\.0\\\\.1:(\\\\d+)/[^\\\\s\\\\u001B]*");';
if (!src.includes(oldPat)) {
  console.error('pattern line not found');
  process.exit(1);
}
src = src.replace(oldPat, newPat);

const oldAssign = `                                    if (matcher.find()) {
                                        launchUrl = matcher.group();
                                        status = "运行中";
                                    }`;
const newAssign = `                                    if (matcher.find()) {
                                        launchUrl = matcher.group();
                                        // trust the port dsh actually printed
                                        try {
                                            if (matcher.groupCount() >= 1) {
                                                port = Integer.parseInt(matcher.group(1));
                                            }
                                        } catch (NumberFormatException ignored) {
                                        }
                                        status = "运行中";
                                    }`;
if (!src.includes(oldAssign)) {
  console.error('assignment block not found');
  process.exit(1);
}
src = src.replace(oldAssign, newAssign);

fs.writeFileSync(f, src, 'utf8');
console.log(JSON.stringify({ anyPort: src.includes('(\\\\d+)/[^'), portSync: src.includes('trust the port dsh actually printed') }));
