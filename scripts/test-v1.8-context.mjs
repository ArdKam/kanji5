import assert from 'node:assert/strict';
import { gradeContext, normalizeContextAnswer } from '../v1.8-context-core.js';

assert.deepEqual(gradeContext('学','学'), {correct:true,quality:'exact',score:1});
assert.deepEqual(gradeContext(' 学 ','学'), {correct:true,quality:'exact',score:1});
assert.deepEqual(gradeContext('学','学'.normalize('NFKC')), {correct:true,quality:'exact',score:1});
assert.deepEqual(gradeContext('', '学'), {correct:false,quality:'empty',score:0});
assert.deepEqual(gradeContext('校', '学'), {correct:false,quality:'wrong',score:0});
assert.equal(normalizeContextAnswer(' 学 '), '学');
console.log('Kanji 5 v1.8 Context Recall grader contract passed.');
