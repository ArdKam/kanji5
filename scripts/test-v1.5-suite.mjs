import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const tests = [
  'test-v1.4-education.mjs',
  'test-v1.4-p1.mjs',
  'test-v1.5-p0.mjs',
  'test-v1.5-recall-core.mjs',
  'test-v1.5-p0-learning.mjs',
  'test-v1.5-dont-know.mjs',
  'test-v1.5-fsrs-sync.mjs',
  'test-v1.5-sync.mjs',
  'test-v1.5-sync-lifecycle.mjs',
  'test-v1.5-persistence.mjs',
  'test-v1.5-architecture.mjs',
  'test-v1.5-network.mjs',
  'test-v1.5-jlpt-order.mjs',
  'test-v1.5-roadmap-final.mjs',
  'test-v1.5-v13-parity.mjs',
  'test-v1.8-production.mjs',
  'test-v1.8-vocabulary.mjs',
  'test-v1.8-context.mjs'
];

const chunks = [];
const failures = [];
for (const test of tests) {
  const result = spawnSync(process.execPath, [`scripts/${test}`], { encoding: 'utf8' });
  const output = [result.stdout ?? '', result.stderr ?? ''].filter(Boolean).join('');
  chunks.push(`===== ${test} =====\nexit=${result.status ?? 'null'} signal=${result.signal ?? 'none'}\n${output}`);
  if (result.status !== 0) failures.push(test);
}
writeFileSync('v1.5-suite-output.txt', chunks.join('\n\n'));
if (failures.length) {
  console.error(`v1.5 suite failed: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`v1.5 suite passed: ${tests.length} tests`);
