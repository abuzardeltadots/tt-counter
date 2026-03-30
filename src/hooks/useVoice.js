import { useState, useRef, useCallback } from 'react';

// Unique voice commands (less likely to false-trigger)
const COMMANDS = {
  a: ['score', 'point', 'first'],
  b: ['switch', 'second', 'next'],
  undo: ['revert', 'cancel', 'back']
};

export default function useVoice(addPointFn, undoFn) {
  const [voiceOn, setVoiceOn] = useState(false);
  const recRef = useRef(null);

  const toggleVoice = useCallback(async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    if (voiceOn) {
      recRef.current?.stop();
      recRef.current = null;
      setVoiceOn(false);
      return;
    }

    // Request mic permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch { return; }

    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = 'en-US';

    r.onresult = (e) => {
      const t = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      if (COMMANDS.a.some(c => t.includes(c))) addPointFn('a');
      else if (COMMANDS.b.some(c => t.includes(c))) addPointFn('b');
      else if (COMMANDS.undo.some(c => t.includes(c))) undoFn();
    };

    r.onerror = () => {};
    r.onend = () => {
      if (recRef.current === r) {
        try { r.start(); } catch { recRef.current = null; setVoiceOn(false); }
      }
    };

    try {
      r.start();
      recRef.current = r;
      setVoiceOn(true);
    } catch { /* unsupported */ }
  }, [voiceOn, addPointFn, undoFn]);

  // Cleanup — call when leaving game screen
  const stopVoice = useCallback(() => {
    if (recRef.current) {
      const r = recRef.current;
      recRef.current = null;
      r.stop();
      setVoiceOn(false);
    }
  }, []);

  return { voiceOn, toggleVoice, stopVoice };
}
