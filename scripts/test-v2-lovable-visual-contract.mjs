import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('v2-presentation.css','utf8');

const requiredTokens=[
  ['--v2-bg','#f4efe3'],
  ['--v2-surface','#fbf8f0'],
  ['--v2-text','#1c1a17'],
  ['--v2-muted','#948d7e'],
  ['--v2-border','#e3dcc9'],
  ['--v2-accent','#c0392b'],
  ['--v2-focus','#26406b'],
  ['--v2-success','#7e8c5a'],
  ['--v2-radius','28px']
];
for(const [token,value] of requiredTokens){
  assert.ok(css.includes(token+':'+value), 'Sumi visual token mismatch: '+token);
}
assert.ok(css.includes('font-family:var(--v2-font-sans)'),'v2 UI must use the semantic sans token');
assert.ok(css.includes('font-family:"Noto Serif JP"'),'v2 Kanji surfaces must use the Japanese serif stack');
assert.ok(css.includes('max-width:880px'),'v2 shell width should match the 880px Sumi Play reference container');
assert.ok(css.includes('--v2-motion-rise:.55s'),'rise motion should match the reference timing');
assert.ok(css.includes('--v2-motion-stamp:.7s'),'stamp motion should match the reference timing');
for(const token of [
  '@keyframes v2-rise',
  '@keyframes v2-stamp',
  '@media (prefers-reduced-motion:reduce)',
  '@media(max-width:600px)',
  '@media(max-width:700px)',
  '@media(max-width:420px)',
  '@media(max-width:360px)',
  '@media(max-height:560px) and (orientation:landscape)',
  '.v2-learning-card{',
  '.v2-exercise-card{',
  '.v2-production-choice-grid{',
  '.v2-daily-summary{',
  '.v2-settings-form{',
  '.v2-dialog{'
]) assert.ok(css.includes(token),'Missing visual-system rule: '+token);

console.log('Kanji 5 v2 Lovable/Sumi Play visual contract passed.');