// Define the missing closeDrawer helper and enlarge the drawer footer row.
const fs = require('node:fs');
const path = require('node:path');

const extPath = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(extPath, 'utf8');

if (!/function closeDrawer\s*\(/.test(js)) {
  const anchor = '  function drawerOpen() {';
  const helper = `  function closeDrawer() {
    if (!drawerOpen()) return false;
    var btn = q('.hHd-Xa_root:not(.hHd-Xa_collapsed) .hHd-Xa_toggle');
    if (btn) { btn.click(); return true; }
    return false;
  }
`;
  if (!js.includes(anchor)) {
    console.error('drawerOpen anchor missing');
    process.exit(1);
  }
  js = js.replace(anchor, helper + anchor);
  fs.writeFileSync(extPath, js, 'utf8');
}
try {
  new Function(js);
  console.log(JSON.stringify({ hasCloseDrawer: /function closeDrawer\s*\(/.test(js), syntaxOk: true }));
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}

const cssPath = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('/* harness-foot-size-v1 */')) {
  css += `
/* harness-foot-size-v1: the footer row was the smallest text in the drawer. */
html[data-harness-android] .hHd-Xa_footArea,
html[data-harness-android] .hHd-Xa_footArea * {
  font-size: 16px !important;
  line-height: 22px !important;
}
html[data-harness-android] .hHd-Xa_footArea button,
html[data-harness-android] .hHd-Xa_footArea [role=button] {
  min-height: 44px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
}
console.log(JSON.stringify({ footRule: css.includes('harness-foot-size-v1') }));
