// Platform: Web (swap for expo-haptics in React Native)

export function vibrate(ms = 15) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

export function vibrateScore() { vibrate(15); }
export function vibrateDeuce() { vibrate(30); }
export function vibrateWin() { vibrate([50, 50, 50, 50, 100]); }
export function vibrateUndo() { vibrate(8); }

// Streak milestone haptics
export function vibrateStreak(count) {
  if (!navigator.vibrate) return;
  if (count === 3) navigator.vibrate([20, 40, 20]);
  else if (count === 5) navigator.vibrate([20, 30, 20, 30, 20]);
  else if (count >= 10) navigator.vibrate([30, 20, 30, 20, 30, 20, 60]);
}
