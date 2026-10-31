// Both overrides lost to more specific shipped rules. Re-issue them with equal
// or higher specificity, placed at the end of the bundle.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(f, 'utf8');
if (css.includes('/* harness-body-text-v2 */')) {
  console.log('already present');
  process.exit(0);
}

css += `
/* harness-body-text-v2: dsh defines --dsh-content-font-size on .wSkVaW_root, so
   the value must be set there (same specificity, later wins) to take effect. */
html[data-harness-android] .wSkVaW_root {
  --dsh-content-font-size: 17px !important;
  --dsh-code-font-size: 15px !important;
}

/* The frame padding is driven by an earlier equal-specificity rule; use a more
   specific selector so the composer sits at the same bottom on both screens. */
html[data-harness-android] body .pI_x6G_frame {
  padding-bottom: 0 !important;
}
`;
fs.writeFileSync(f, css, 'utf8');
console.log(JSON.stringify({ added: true, bytes: css.length }));
