const normalizeVocabulary = value => String(value ?? '')
  .trim()
  .normalize('NFKC')
  .replace(/[\s\u3000]+/g, '')
  .replace(/[。．｡.!！?？、，,，]/g, '');

export function gradeVocabulary(input, expected) {
  const value = normalizeVocabulary(input);
  const answer = normalizeVocabulary(expected);
  if (!value) return { correct: false, quality: 'empty', score: 0 };
  if (!answer) return { correct: false, quality: 'wrong', score: 0 };
  if (value === answer) return { correct: true, quality: 'exact', score: 1 };
  return { correct: false, quality: 'wrong', score: 0 };
}

export function normalizeVocabularyAnswer(value) {
  return normalizeVocabulary(value);
}
