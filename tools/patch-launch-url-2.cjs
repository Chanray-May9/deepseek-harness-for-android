const fs = require('node:fs');
const path = require('node:path');

const f = path.join(
  __dirname, '..', 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java',
  'com', 'deepseek', 'harness', 'android', 'RuntimeService.java',
);
let src = fs.readFileSync(f, 'utf8');
const before = src;

// 1. accept any port in the printed URL
src = src.replace(
  '":" + port + "/[^\\\\s\\\\u001B]*"',
  '":(\\\\d+)/[^\\\\s\\\\u001B]*"',
);

// 2. write the real port back after a successful match
src = src.replace(
  `                                        launchUrl = matcher.group();
                                        status = "运行中";`,
  `                                        launchUrl = matcher.group();
                                        try {
                                            if (matcher.groupCount() >= 1) {
                                                port = Integer.parseInt(matcher.group(1));
                                            }
                                        } catch (NumberFormatException ignored) {
                                        }
                                        status = "运行中";`,
);

fs.writeFileSync(f, src, 'utf8');
const anyPort = src.includes('(\\\\d+)/[^');
const portSync = src.includes('Integer.parseInt(matcher.group(1))');
console.log(JSON.stringify({ changed: src !== before, anyPort, portSync }));
