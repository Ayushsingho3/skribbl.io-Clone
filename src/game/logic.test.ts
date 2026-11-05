import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  isCorrectGuess,
  getLevenshteinDistance,
  isCloseGuess,
  calculateGuesserScore,
  calculateDrawerScore,
  generateMaskedWord
} from './logic';

test('normalizeText trims, lowercases and condenses spaces', () => {
  assert.equal(normalizeText('  Ice   Cream  '), 'ice cream');
  assert.equal(normalizeText('PIZZA'), 'pizza');
  assert.equal(normalizeText(''), '');
});

test('isCorrectGuess performs exact case-insensitive match', () => {
  assert.equal(isCorrectGuess('Elephant', 'elephant'), true);
  assert.equal(isCorrectGuess('  elephant ', 'ELEPHANT'), true);
  assert.equal(isCorrectGuess('elephnt', 'elephant'), false);
  assert.equal(isCorrectGuess('', 'elephant'), false);
});

test('getLevenshteinDistance computes accurate character distances', () => {
  assert.equal(getLevenshteinDistance('cat', 'cat'), 0);
  assert.equal(getLevenshteinDistance('cat', 'bat'), 1);
  assert.equal(getLevenshteinDistance('pizza', 'piza'), 1);
  assert.equal(getLevenshteinDistance('guitar', 'guittar'), 1);
  assert.equal(getLevenshteinDistance('hello', 'world'), 4);
});

test('isCloseGuess identifies typos that are 1-2 edits away', () => {
  assert.equal(isCloseGuess('piza', 'pizza'), true);
  assert.equal(isCloseGuess('elephnt', 'elephant'), true);
  assert.equal(isCloseGuess('cat', 'dog'), false);
  assert.equal(isCloseGuess('pizza', 'pizza'), false); // Exact match is not "close", it's correct!
});

test('calculateGuesserScore rewards speed and first-place bonus', () => {
  const fullTimeScore = calculateGuesserScore(80, 80, 1);
  const halfTimeScore = calculateGuesserScore(40, 80, 2);
  const lateScore = calculateGuesserScore(0, 80, 3);

  // Full time: base 100 + speed 300 + rank 100 = 500
  assert.equal(fullTimeScore, 500);
  // Half time: base 100 + speed 150 + rank 50 = 300
  assert.equal(halfTimeScore, 300);
  // Late score: base 100 + speed 0 + rank 0 = 100
  assert.equal(lateScore, 100);
});

test('calculateDrawerScore scales with proportion of guessers', () => {
  assert.equal(calculateDrawerScore(0, 4), 0);
  assert.equal(calculateDrawerScore(2, 4), 125);
  assert.equal(calculateDrawerScore(4, 4), 250);
});

test('generateMaskedWord produces blanks with spaces and revealed letters', () => {
  const maskedEmpty = generateMaskedWord('cat', new Set<number>());
  assert.equal(maskedEmpty, '_ _ _');

  const maskedRevealed = generateMaskedWord('cat', new Set<number>([0]));
  assert.equal(maskedRevealed, 'C _ _');

  const maskedWithSpace = generateMaskedWord('ice cream', new Set<number>([0, 4]));
  assert.equal(maskedWithSpace, 'I _ _   C _ _ _ _');
});
