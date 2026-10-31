// Settings header on phones: keep only the close control, and reserve its width
// in the category row so the last tab is not clipped.
const fs = require('node:fs');
const path = require('node:path');

const cssPath = path.join(process.argv[2], 'android-mobile.css');
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('/* harness-settings-header-v1 */')) {
  css += `
/* harness-settings-header-v1 */
html[data-harness-android] .VOzbGW_header button:not(.VOzbGW_close) {
  display: none !important;
}
html[data-harness-android] .VOzbGW_navTitle {
  padding-right: 56px !important;
}
html[data-harness-android] .VOzbGW_navList {
  padding-right: 56px !important;
  scroll-padding-right: 56px;
}
html[data-harness-android] .VOzbGW_close {
  position: absolute;
  right: 8px;
  top: 6px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('settings header css added');
} else {
  console.log('already present');
}
