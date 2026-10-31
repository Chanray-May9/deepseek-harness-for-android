// Replay the sidebar open/close with real MotionEvents: React rejects synthetic
// .click(), but dispatches touch events exactly like a finger tap.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(
  __dirname, '..', 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java',
  'com', 'deepseek', 'harness', 'android', 'MainActivity.java',
);
let src = fs.readFileSync(f, 'utf8');
if (src.includes('harnessTouchWarmup')) {
  console.log('already present');
  process.exit(0);
}

// 1. schedule the warm-up right after the page is loaded
const anchor = `            }, 12000L);`;
const scheduled = `            }, 12000L);
            /* harnessTouchWarmup: the model picker stays inert until the sidebar has
               been opened and closed once by a real touch. Synthetic .click() is
               ignored by React, so replay genuine MotionEvents at the drawer
               button's position. */
            this.main.postDelayed(new Runnable() {
                @Override // java.lang.Runnable
                public final void run() {
                    MainActivity.this.tapWeb(dp(40), dp(42));
                    MainActivity.this.main.postDelayed(new Runnable() {
                        @Override // java.lang.Runnable
                        public final void run() {
                            MainActivity.this.tapWeb(dp(40), dp(42));
                        }
                    }, 900L);
                }
            }, 6000L);`;
if (!src.includes(anchor)) {
  console.error('12s anchor not found');
  process.exit(1);
}
src = src.replace(anchor, scheduled);

// 2. add the touch injector helper next to the dp() helper
const dpAnchor = `    private int dp(int i) {`;
const helper = `    private void tapWeb(int x, int y) {
        try {
            long now = android.os.SystemClock.uptimeMillis();
            android.view.MotionEvent down = android.view.MotionEvent.obtain(now, now, android.view.MotionEvent.ACTION_DOWN, x, y, 0);
            this.web.dispatchTouchEvent(down);
            down.recycle();
            android.view.MotionEvent up = android.view.MotionEvent.obtain(now, now + 60, android.view.MotionEvent.ACTION_UP, x, y, 0);
            this.web.dispatchTouchEvent(up);
            up.recycle();
        } catch (Throwable ignored) {
        }
    }

`;
if (!src.includes(dpAnchor)) {
  console.error('dp anchor not found');
  process.exit(1);
}
src = src.replace(dpAnchor, helper + dpAnchor);

fs.writeFileSync(f, src, 'utf8');
console.log(JSON.stringify({
  scheduled: src.includes('harnessTouchWarmup'),
  helper: src.includes('private void tapWeb'),
}));
