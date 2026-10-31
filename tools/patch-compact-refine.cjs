// Compact row should read like the reference: bare plus glyph, shorter pill.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(f, 'utf8');
if (css.includes('/* harness-compact-refine-v1 */')) {
  console.log('already present');
  process.exit(0);
}

css += `
/* harness-compact-refine-v1: bare plus glyph and a shorter pill, matching the reference. */
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_card {
  min-height: 56px !important;
  padding: 6px 8px !important;
}
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_add {
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--dsw-alias-label-primary, #12131a) !important;
}
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_add svg {
  width: 24px !important;
  height: 24px !important;
}
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_primary {
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
}
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_input {
  min-height: 40px !important;
  padding: 8px 6px !important;
  font-size: 16px !important;
}
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_placeholder {
  top: 8px !important;
  left: 8px !important;
  right: 8px !important;
  font-size: 16px !important;
  color: var(--dsw-alias-label-tertiary, #9aa0aa) !important;
}
`;
fs.writeFileSync(f, css, 'utf8');
console.log(
  JSON.stringify(
    {
      rule: css.includes('harness-compact-refine-v1'),
      balanced: (css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length,
      bytes: css.length,
    },
    null,
    1,
  ),
);
