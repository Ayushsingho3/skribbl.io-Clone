/**
 * Pure game logic utilities: scoring, hints, and guess validation.
 * Decoupled from I/O and tested with node:test.
 */

export function normalizeText(text: string): string {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isCorrectGuess(guess: string, targetWord: string): boolean {
  if (!guess || !targetWord) return false;
  return normalizeText(guess) === normalizeText(targetWord);
}

/**
 * Calculates Levenshtein Distance between two strings to detect "Close!" guesses.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);

  if (normA === normB) return 0;
  if (!normA.length) return normB.length;
  if (!normB.length) return normA.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= normB.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= normA.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= normB.length; i++) {
    for (let j = 1; j <= normA.length; j++) {
      if (normB.charAt(i - 1) === normA.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[normB.length][normA.length];
}

/**
 * Checks if a guess is close (e.g. 1 character typo for words > 3 letters, or 2 typos for long words)
 */
export function isCloseGuess(guess: string, targetWord: string): boolean {
  const normGuess = normalizeText(guess);
  const normTarget = normalizeText(targetWord);
  if (normGuess === normTarget) return false;

  const distance = getLevenshteinDistance(normGuess, normTarget);
  if (normTarget.length <= 4) {
    return distance === 1;
  }
  return distance <= 2;
}

/**
 * Calculates guesser score:
 * Base: 100 points
 * Speed bonus: up to 300 points depending on remaining time ratio
 * Rank bonus: First guesser gets extra 100, second gets 50
 */
export function calculateGuesserScore(
  timeLeft: number,
  totalDrawTime: number,
  orderGuessed: number = 1
): number {
  const validTotal = Math.max(10, totalDrawTime);
  const clampedTime = Math.max(0, Math.min(timeLeft, validTotal));
  const timeFraction = clampedTime / validTotal;

  const basePoints = 100;
  const speedBonus = Math.round(timeFraction * 300);
  const rankBonus = orderGuessed === 1 ? 100 : orderGuessed === 2 ? 50 : 0;

  return basePoints + speedBonus + rankBonus;
}

/**
 * Calculates drawer score based on percentage of guessers who guessed correctly
 */
export function calculateDrawerScore(guessedCount: number, totalGuessers: number): number {
  if (totalGuessers <= 0 || guessedCount <= 0) return 0;
  const ratio = Math.min(1, guessedCount / totalGuessers);
  return Math.round(ratio * 250);
}

/**
 * Generates masked string (e.g. "c _ t" or "_ _ _ _")
 */
export function generateMaskedWord(word: string, revealedIndices: Set<number>): string {
  if (!word) return '';
  const words = word.split(' ');
  let charGlobalIndex = 0;
  
  return words
    .map(w => {
      const maskedChars = w.split('').map(char => {
        const idx = charGlobalIndex++;
        if (char === '-' || char === '\'') return char;
        if (revealedIndices.has(idx)) return char.toUpperCase();
        return '_';
      });
      charGlobalIndex++; // for the space between words
      return maskedChars.join(' ');
    })
    .join('   ');
}

/**
 * Selects pseudo-random indices to reveal for hints based on revealed count
 */
export function getRevealedIndices(word: string, count: number): Set<number> {
  const letterIndices: number[] = [];
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (ch !== ' ' && ch !== '-' && ch !== '\'') {
      letterIndices.push(i);
    }
  }

  // Max revealable is length - 1 (leave at least one blank)
  const maxReveal = Math.max(0, letterIndices.length - 1);
  const toReveal = Math.min(count, maxReveal);

  // Deterministically or randomly select
  const selected = new Set<number>();
  const pool = [...letterIndices];
  // Seed-free selection
  for (let i = 0; i < toReveal; i++) {
    if (pool.length === 0) break;
    const randIdx = Math.floor(Math.random() * pool.length);
    selected.add(pool[randIdx]);
    pool.splice(randIdx, 1);
  }

  return selected;
}
