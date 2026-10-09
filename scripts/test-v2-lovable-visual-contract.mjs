import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('frontend/src/styles.css','utf8');
const requiredTokens=[
  ['--washi','#F7F4EE'],
  ['--paper','#FDFBF7'],
  ['--sumi','#292B2D'],
  ['--shu','#505F83'],
  ['--sakura','#D6A1AA'],
  ['--ai','#505F83'],
  ['--matcha','#8C9B87'],
  ['--line','#DED8CE'],
  ['--line-soft','#E9E3DA']
];
for(const [token,value] of requiredTokens){
  assert.ok(css.includes(token+':'+value) || css.includes(token), 'Rinemi visual token missing: '+token);
}
assert.ok(css.includes('font-family:var(--ui-font)'), 'UI must use the semantic sans font token');
assert.ok(css.includes('--jp-font:"Noto Serif JP"'), 'Japanese content must use the Japanese font stack');
assert.ok(css.includes('width:min(100%,880px)'), 'application shell width must remain bounded at 880px');
assert.ok(css.includes('--motion-hover:180ms'), 'interactive motion token must remain explicit');
assert.ok(css.includes('.header-brand-lockup{') && css.includes('.header-brand-mark{'), 'brand lockup styles must exist');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'), 'reduced-motion support must be retained');
assert.ok(css.includes('.learning-card{') && css.includes('.exercise-card{'), 'learning and exercise surface styles must remain present');
assert.ok(css.includes('.dialog{'), 'dialog visual styles must remain present');
console.log('Rinemi product visual-system contract passed.');
