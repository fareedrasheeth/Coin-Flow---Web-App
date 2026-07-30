'use client';
import { useEffect, useState } from 'react';

export function useVoice() {
  const [enabled, setEnabled] = useState(false);
  const [voice, setVoice] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const selectedVoice = voices.find(v => v.lang.includes('en')) || voices[0];
          setVoice(selectedVoice);
        }
      };
      const timer = setTimeout(updateVoices, 0);
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        clearTimeout(timer);
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const speak = (text) => {
    if (!enabled || !('speechSynthesis' in window)) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.pitch = 1.2;
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const announceCoin = (denomination, label) => {
    speak(`${label} coin received. ${denomination} Rupees added.`);
  };

  const announceAlert = (message) => {
    speak(`Alert: ${message}`);
  };

  return { enabled, setEnabled, speak, announceCoin, announceAlert };
}
