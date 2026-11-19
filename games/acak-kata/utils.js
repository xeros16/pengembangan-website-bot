export function normalizeScrambleAnswer(value) {
  return String(value ?? '').normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
export function scrambleWord(word, random = Math.random) {
  const chars = [...String(word)];
  if (chars.length < 2) return String(word);
  let result = chars.join('');
  for (let attempt = 0; attempt < 12 && result === chars.join(''); attempt += 1) {
    const shuffled = [...chars];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    result = shuffled.join('');
  }
  if (result === chars.join('')) result = `${result.slice(1)}${result[0]}`;
  return result;
}
