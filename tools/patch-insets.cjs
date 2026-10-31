// Edge-to-edge CSS: content stays clear of the system bars while overlays
// (dialogs, drawer scrim, right panel) still paint over the full window.
const fs = require('node:fs');
const path = require('node:path');

const cssPath = path.join(process.argv[2], 'android-mobile.css');
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('/* harness-android-insets-v1 */')) {
  css += `
/* harness-android-insets-v1 */
html[data-harness-android] {
  --hm-inset-top: 0px;
  --hm-inset-bottom: 0px;
}
/* The frame keeps painting behind the bars, only its content is pushed down. */
html[data-harness-android] .pI_x6G_frame {
  padding-top: var(--hm-inset-top) !important;
  padding-bottom: var(--hm-inset-bottom) !important;
  box-sizing: border-box;
}
/* Floating controls follow the same offset. */
html[data-harness-android] .hHd-Xa_collapsed .hHd-Xa_toggle {
  top: calc(var(--hm-inset-top) + 8px) !important;
}
#harness-mobile-actions {
  top: calc(var(--hm-inset-top) + 8px) !important;
}
#harness-mobile-tools-close {
  top: calc(var(--hm-inset-top) + 8px) !important;
}
html[data-harness-android] .wSkVaW_header:not(.wSkVaW_headerBlank) {
  top: calc(var(--hm-inset-top) + 8px) !important;
}
/* Overlays must cover the bars, so they opt out of the frame padding. */
html[data-harness-android] .mP3x-q_overlayLayer,
html[data-harness-android] [role=dialog],
html[data-harness-android] [role=menu] {
  margin-top: 0 !important;
}
html[data-harness-android] .pI_x6G_composerSeat,
html[data-harness-android] .an3WzG_composerSeat {
  padding-bottom: 0 !important;
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('insets css added, bytes:', css.length);
} else {
  console.log('insets css already present');
}
