import { useState, useEffect, useCallback, useRef } from 'react';

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  source: string;
}

export interface TTSVoice {
  name: string;
  lang: string;
  default?: boolean;
  voiceURI?: string;
}

export interface UseTextToSpeechReturn {
  speaking: boolean;
  paused: boolean;
  currentText: string;
  voices: TTSVoice[];
  selectedVoice: TTSVoice | null;
  rate: number;
  setRate: (rate: number) => void;
  setVoice: (voice: TTSVoice) => void;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  togglePlayPause: (text: string) => void;
}

const mapVoices = (voices: SpeechSynthesisVoice[]): TTSVoice[] => {
  return voices.map((v) => ({
    name: v.name,
    lang: v.lang,
    default: v.default,
    voiceURI: v.voiceURI,
  }));
};

/** Prefer female English voices for broadcast narration */
const FEMALE_VOICE_HINTS = ['Female', 'Samantha', 'Victoria', 'Karen', 'Google US English', 'Google UK English'];

function sortEnglishVoices(a: TTSVoice, b: TTSVoice): number {
  const aIsEn = a.lang.startsWith('en') ? 1 : 0;
  const bIsEn = b.lang.startsWith('en') ? 1 : 0;
  if (aIsEn !== bIsEn) return bIsEn - aIsEn;
  const aFemale = FEMALE_VOICE_HINTS.some((h) => a.name.includes(h)) ? 1 : 0;
  const bFemale = FEMALE_VOICE_HINTS.some((h) => b.name.includes(h)) ? 1 : 0;
  return bFemale - aFemale;
}

/** Convert a news item into a professional broadcast script */
export function generateScript(item: NewsItem): string {
  return `Breaking news. ${item.title}. ${item.excerpt} This is ${item.source} reporting. More details after the break.`;
}

/** Professional English voice presets for the anchor UI */
export const voicePresets = [
  { name: 'Emma', label: 'Female US, Professional', color: '#FF9933' },
  { name: 'James', label: 'Male UK, Authoritative', color: '#2196F3' },
  { name: 'Priya', label: 'Female Indian English', color: '#4CAF50' },
  { name: 'David', label: 'Male US, News Anchor', color: '#9C27B0' },
];

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice | null>(null);
  const [rate, setRate] = useState(1.0);
  const [currentText, setCurrentText] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const available = synth.getVoices();
      if (available.length > 0) {
        const mapped = mapVoices(available);
        // Sort: English first, female-preferred
        mapped.sort(sortEnglishVoices);
        setVoices(mapped);

        // Select best default: female English preferred
        const defaultVoice =
          mapped.find((v) => v.lang.startsWith('en') && FEMALE_VOICE_HINTS.some((h) => v.name.includes(h))) ??
          mapped.find((v) => v.name.includes('Google US English')) ??
          mapped.find((v) => v.name.includes('Samantha')) ??
          mapped.find((v) => v.lang.startsWith('en') && v.default) ??
          mapped.find((v) => v.lang.startsWith('en')) ??
          mapped[0];
        if (defaultVoice && !selectedVoice) {
          setSelectedVoice(defaultVoice);
        }
      }
    };

    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);

    const interval = setInterval(() => {
      if (synth.speaking) {
        setSpeaking(true);
      } else if (!synth.paused) {
        setSpeaking(false);
        setPaused(false);
      }
    }, 100);

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices);
      clearInterval(interval);
    };
  }, [selectedVoice]);

  const speak = useCallback(
    (text: string) => {
      const synth = window.speechSynthesis;
      if (!synth) return;

      // Cancel any ongoing speech
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to find matching voice
      const allVoices = synth.getVoices();
      if (selectedVoice?.voiceURI) {
        const match = allVoices.find((v) => v.voiceURI === selectedVoice.voiceURI);
        if (match) utterance.voice = match;
      } else if (selectedVoice?.name) {
        const match = allVoices.find((v) => v.name === selectedVoice.name);
        if (match) utterance.voice = match;
      }

      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
      };

      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
      };

      utterance.onerror = () => {
        setSpeaking(false);
        setPaused(false);
      };

      utterance.onpause = () => {
        setPaused(true);
      };

      utterance.onresume = () => {
        setPaused(false);
      };

      utteranceRef.current = utterance;
      setCurrentText(text);
      synth.speak(utterance);
    },
    [rate, selectedVoice]
  );

  const pause = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth.paused) {
      synth.resume();
      setPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    const synth = window.speechSynthesis;
    synth.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  const togglePlayPause = useCallback(
    (text: string) => {
      if (speaking && !paused) {
        pause();
      } else if (paused) {
        resume();
      } else {
        speak(text);
      }
    },
    [speaking, paused, speak, pause, resume]
  );

  return {
    speaking,
    paused,
    currentText,
    voices,
    selectedVoice,
    rate,
    setRate,
    setVoice: setSelectedVoice,
    speak,
    pause,
    resume,
    stop,
    togglePlayPause,
  };
}
