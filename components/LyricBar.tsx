"use client";

import { useEffect, useState } from 'react';
import { useMusic } from './MusicProvider';

export default function LyricBar() {
  const { isPlaying, currentLyric, currentSong } = useMusic();
  const [displayedLyric, setDisplayedLyric] = useState('');

  useEffect(() => {
    setDisplayedLyric('');
    let i = 0;
    const targetText = currentLyric || '';
    if (!targetText) return;

    const typingInterval = setInterval(() => {
      if (i <= targetText.length) {
        setDisplayedLyric(targetText.slice(0, i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 35);

    return () => clearInterval(typingInterval);
  }, [currentLyric]);

  if (!currentSong) return null;

  const waves = [
    'bg-emerald-300',
    'bg-lime-300',
    'bg-green-400',
    'bg-emerald-400',
    'bg-teal-300',
  ];

  return (
    <>
      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor { animation: cursorBlink 0.8s step-end infinite; }
        @keyframes safeWave {
          0%, 100% { height: 8px; }
          50% { height: 28px; }
        }
        .safe-wave-active { animation: safeWave 1s ease-in-out infinite; }
      `}</style>

      <div className="w-full rounded-3xl bg-white/55 dark:bg-emerald-950/35 backdrop-blur-xl border border-emerald-200/60 dark:border-emerald-500/20 shadow-xl p-5 flex items-center justify-between transition-all duration-700 hover:shadow-emerald-400/20 group h-20">
        <div className="flex items-end justify-center gap-[4px] h-8 w-16">
          {waves.map((color, index) => (
            <div
              key={index}
              className={`w-1.5 rounded-t-sm transition-all duration-500 ease-out ${isPlaying ? `${color} safe-wave-active` : 'h-1 bg-emerald-300/40'}`}
              style={{
                animationDelay: `${index * 120}ms`,
                height: isPlaying ? undefined : '4px',
              }}
            />
          ))}
        </div>

        <div className="flex-1 px-8 flex justify-center items-center overflow-hidden">
          <p className="text-emerald-950 dark:text-emerald-50 text-lg font-bold tracking-wide truncate drop-shadow-[0_0_8px_rgba(167,243,208,0.6)]">
            {displayedLyric}
            <span className="inline-block w-[3px] h-5 bg-lime-400 align-middle ml-1 shadow-[0_0_8px_rgba(163,230,53,0.8)] animate-cursor" />
          </p>
        </div>

        <div className="w-16 flex justify-end">
          <svg className={`w-6 h-6 text-emerald-500/70 transition-all duration-500 ${isPlaying ? 'animate-bounce' : 'opacity-30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
      </div>
    </>
  );
}
