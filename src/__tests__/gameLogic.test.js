import { describe, it, expect } from 'vitest';
import { calcServe, calcServeRemaining, isDeuce, getWinner, getDeuceResetScore, formatDuration } from '../gameLogic';

describe('calcServe', () => {
  it('alternates every 2 serves', () => {
    expect(calcServe(0, 0, 21, 2)).toBe('a');
    expect(calcServe(1, 0, 21, 2)).toBe('a');
    expect(calcServe(1, 1, 21, 2)).toBe('b');
    expect(calcServe(2, 1, 21, 2)).toBe('b');
    expect(calcServe(2, 2, 21, 2)).toBe('a');
  });
  it('alternates every point during deuce', () => {
    expect(calcServe(20, 20, 21, 2)).toBe('a');
    expect(calcServe(21, 20, 21, 2)).toBe('b');
  });
});

describe('isDeuce', () => {
  it('detects deuce at 20-20 for 21pt', () => { expect(isDeuce(20, 20, 21)).toBe(true); });
  it('detects deuce at 10-10 for 11pt', () => { expect(isDeuce(10, 10, 11)).toBe(true); });
  it('not deuce at 19-20', () => { expect(isDeuce(19, 20, 21)).toBe(false); });
  it('not deuce at 20-21', () => { expect(isDeuce(20, 21, 21)).toBe(false); });
});

describe('getWinner', () => {
  it('no winner below target', () => { expect(getWinner(15, 10, 21)).toBeNull(); });
  it('winner at target with 2+ lead', () => { expect(getWinner(21, 19, 21)).toBe('a'); });
  it('no winner at target without 2 lead', () => { expect(getWinner(21, 20, 21)).toBeNull(); });
  it('winner with extended deuce', () => { expect(getWinner(23, 21, 21)).toBe('a'); });
  it('team b wins', () => { expect(getWinner(18, 21, 21)).toBe('b'); });
});

describe('getDeuceResetScore', () => {
  it('21pt resets to 15', () => { expect(getDeuceResetScore(21)).toBe(15); });
  it('11pt resets to 7', () => { expect(getDeuceResetScore(11)).toBe(7); });
});

describe('formatDuration', () => {
  it('formats seconds', () => { expect(formatDuration(45000)).toBe('45s'); });
  it('formats minutes', () => { expect(formatDuration(125000)).toBe('2m 5s'); });
  it('formats hours', () => { expect(formatDuration(3700000)).toBe('1h 1m'); });
});
