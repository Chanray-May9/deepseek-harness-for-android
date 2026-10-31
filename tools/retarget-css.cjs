// Rewrite the phone shell stylesheet onto this package's real class prefixes.
const fs = require('node:fs');
const path = require('node:path');

const src = path.join(__dirname, '..', 'mobile', 'phone-shell.css');
const dst = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');

let css = fs.readFileSync(src, 'utf8');

// rc.5 prefixes used by mistake  ->  rc.2 prefixes shipped in this APK
const MAP = [
  ['an3WzG_', 'wSkVaW_'],
  ['WOwLGG_', 'pXSMma_'],
  ['m2hUqa_', 'cubgiG_'],
  ['GRgSLq_', 'uV2eYG_'],
  ['wtg9ga_', 'hHd-Xa_'],
];

for (const [from, to] of MAP) {
  css = css.split('.' + from).join('.' + to);
}

// Class names that do not exist in rc.2 are dropped rather than left dangling.
const drop = ['.pXSMma_stack', '.pXSMma_previewBadge'];
for (const dead of drop) {
  const re = new RegExp('^[^\\n{]*' + dead.replace('.', '\\.') + '[^\\n{]*\\{[^}]*\\}\\s*', 'gm');
  css = css.replace(re, '');
}

// rc.2 composer keeps its own two-row structure; these selectors are the real ones.
css += `
/* ---------------------------------------------------- rc.2 corrections --- */
html[data-harness-android] .uV2eYG_root,
html[data-harness-android] .uV2eYG_hero {
  width: 100%;
  padding: 0 !important;
}
html[data-harness-android] .uV2eYG_card {
  min-height: 118px;
  box-sizing: border-box;
  padding: 10px 8px 8px !important;
  gap: 4px !important;
  border: 1px solid var(--dsw-alias-border-l3, #ececf0) !important;
  border-radius: var(--hm-radius) !important;
  background: var(--dsw-alias-bg-base, #fff) !important;
}
html[data-harness-android] .uV2eYG_input {
  min-height: 44px;
  padding: 8px 12px 0 !important;
  font-size: 16px !important;
  line-height: 24px !important;
}
html[data-harness-android] .uV2eYG_placeholder {
  top: 8px !important;
  left: 12px !important;
  right: 12px !important;
  font-size: 16px !important;
  line-height: 24px !important;
}
html[data-harness-android] .uV2eYG_row {
  align-items: center;
  gap: 6px !important;
  padding: 0 2px !important;
}
html[data-harness-android] .uV2eYG_add,
html[data-harness-android] .uV2eYG_primary {
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
  flex: none;
}
html[data-harness-android] .uV2eYG_add svg,
html[data-harness-android] .uV2eYG_primary svg {
  width: 22px;
  height: 22px;
}
html[data-harness-android] .pXSMma_headline {
  flex-direction: column !important;
  align-items: center;
  gap: 18px !important;
  font-size: 22px !important;
  line-height: 30px !important;
  font-weight: 500;
  text-align: center;
}
html[data-harness-android] .pXSMma_fish {
  width: 54px !important;
  height: auto !important;
  color: #4d6bfe !important;
  fill: #4d6bfe !important;
}
html[data-harness-android] .pXSMma_fish path {
  fill: #4d6bfe !important;
}
html[data-harness-android] .pXSMma_workspace,
html[data-harness-android] .cubgiG_seat {
  min-height: 48px !important;
  height: 48px !important;
  padding: 0 8px 0 4px !important;
  gap: 10px !important;
  border-radius: 12px;
  font-size: 17px !important;
  line-height: 24px !important;
}
html[data-harness-android] .pXSMma_workspace svg,
html[data-harness-android] .cubgiG_seat svg {
  width: 22px;
  height: 22px;
  flex: none;
}
html[data-harness-android] .pXSMma_workspace > svg:last-child,
html[data-harness-android] .cubgiG_seat > svg:last-child {
  width: 16px;
  height: 16px;
  opacity: .5;
}
html[data-harness-android] .wSkVaW_heroWorkspaceRow {
  flex-direction: column !important;
  align-items: flex-start !important;
  gap: 2px !important;
  margin-top: auto !important;
  padding: 0 0 10px !important;
}
`;

fs.writeFileSync(dst, css, 'utf8');
const open = (css.match(/\{/g) || []).length;
const close = (css.match(/\}/g) || []).length;
console.log(JSON.stringify({ out: path.basename(dst), bytes: css.length, braces: open + '/' + close, balanced: open === close }));
