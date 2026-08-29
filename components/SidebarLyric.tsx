"use client";
import { useMusic } from './MusicProvider';
import { useState, useEffect } from 'react';

export default function SidebarLyric() {
  const { currentSong, currentLyric, isPlaying } = useMusic();
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

  return (
    <div className="bg-white/55 dark:bg-emerald-950/35 backdrop-blur-xl rounded-3xl p-6 border border-emerald-200/60 dark:border-emerald-500/20 shadow-xl transition-colors duration-700">
      <h3 className="font-black text-emerald-950 dark:text-emerald-50 mb-4 border-l-4 border-lime-400 pl-2 text-sm">NOW PLAYING</h3>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-200/80 shadow-md animate-[spin_6s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
          <img src={currentSong.cover} className="w-full h-full object-cover" alt="cover" />
        </div>

        <div className="flex-1 overflow-hidden">
          <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-50 truncate">{currentSong.title}</h4>
          <p className="text-xs text-emerald-800/70 dark:text-emerald-100/70 truncate">{currentSong.artist}</p>
        </div>
      </div>

      <div className="bg-emerald-50/70 dark:bg-emerald-950/45 p-3 rounded-xl min-h-[60px] flex items-center justify-center text-center shadow-inner border border-emerald-200/40 dark:border-emerald-500/15">
        <p className="text-xs font-bold text-emerald-700 dark:text-lime-200">
          {displayedLyric}
          <span className="inline-block w-[3px] h-3 ml-1 bg-lime-400 animate-cursor align-middle" />
        </p>
      </div>

      <style>{`@keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } } .animate-cursor { animation: cursorBlink 0.8s step-end infinite; }`}</style>
    </div>
  );
}
