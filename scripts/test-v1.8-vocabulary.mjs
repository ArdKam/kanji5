import assert from 'node:assert/strict';
import { gradeVocabulary, normalizeVocabularyAnswer } from '../v1.8-vocabulary-core.js';

assert.deepEqual(gradeVocabulary('学生','学生'), {correct:true,quality:'exact',score:1});
assert.deepEqual(gradeVocabulary(' 学生 ','学生'), {correct:true,quality:'exact',score:1});
assert.deepEqual(gradeVocabulary('学生。','学生'), {correct:true,quality:'exact',score:1});
assert.deepEqual(gradeVocabulary('', '学生'), {correct:false,quality:'empty',score:0});
assert.deepEqual(gradeVocabulary('学校', '学生'), {correct:false,quality:'wrong',score:0});
assert.equal(normalizeVocabularyAnswer(' 学 生　'), '学生');
console.log('Kanji 5 v1.8 Vocabulary Recall grader contract passed.');
