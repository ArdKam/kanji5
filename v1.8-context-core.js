export function normalizeContextAnswer(value) {
  return String(value ?? '').trim().normalize('NFKC');
}

export function gradeContext(input, expected) {
  const value = normalizeContextAnswer(input);
  const answer = normalizeContextAnswer(expected);
  if (!value) return {correct:false,quality:'empty',score:0};
  if (!answer) return {correct:false,quality:'wrong',score:0};
  if (value === answer) return {correct:true,quality:'exact',score:1};
  return {correct:false,quality:'wrong',score:0};
}
