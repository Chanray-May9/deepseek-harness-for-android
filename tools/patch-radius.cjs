// Restore the shipped radius scale and make the compact row a true pill.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(f, 'utf8');
const before = css;

// drop the radius override on the card so the shipped 26px / 34px apply again
css = css.replace(/\n\s*border-radius: var\(--hm-radius\) !important;/g, '');

if (!css.includes('/* harness-pill-v1 */')) {
  css += `
/* harness-pill-v1: the compact single row is a pill, exactly half its height. */
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_card {
  border-radius: 999px !important;
}
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_scroll {
  border-radius: 999px;
}
`;
}

if (css === before) {
  console.error('nothing changed');
  process.exit(1);
}
fs.writeFileSync(f, css, 'utf8');
console.log(
  JSON.stringify(
    {
      radiusOverrideRemoved: !/border-radius: var\(--hm-radius\)/.test(css),
      pillRule: css.includes('harness-pill-v1'),
      shipped26Kept: /\.uV2eYG_card \{[^}]*\}/.test(css),
      balanced: (css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length,
    },
    null,
    1,
  ),
);
