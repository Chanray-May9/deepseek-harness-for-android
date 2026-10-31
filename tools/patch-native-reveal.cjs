// Dismiss the startup overlay from native code if the page never signals ready.
// JS-side readiness is timing dependent; this does not depend on it at all.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(
  __dirname, '..', 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java',
  'com', 'deepseek', 'harness', 'android', 'MainActivity.java',
);
let src = fs.readFileSync(f, 'utf8');
if (src.includes('harnessNativeReveal')) {
  console.log('already present');
  process.exit(0);
}

const anchor = `            this.web.loadUrl(str);`;
const injected = `            this.web.loadUrl(str);
            /* harnessNativeReveal: the overlay is only dismissed by the page's own
               ready() call, which is timing dependent. Reveal unconditionally after
               a short grace period so a slow or silent bridge can never leave the
               app stuck on "connection is slow". */
            this.main.postDelayed(new Runnable() {
                @Override // java.lang.Runnable
                public final void run() {
                    if (MainActivity.this.loading.getVisibility() == 0) {
                        MainActivity.this.loading.setVisibility(8);
                        RuntimeService.log("ANDROID_NATIVE_REVEAL");
                    }
                }
            }, 12000L);`;
if (!src.includes(anchor)) {
  console.error('loadUrl anchor not found');
  process.exit(1);
}
src = src.replace(anchor, injected);
fs.writeFileSync(f, src, 'utf8');
console.log(JSON.stringify({ injected: src.includes('ANDROID_NATIVE_REVEAL'), occurrences: (src.match(/harnessNativeReveal/g) || []).length }));
