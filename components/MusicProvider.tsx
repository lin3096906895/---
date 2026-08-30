"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { siteConfig } from "../siteConfig";

type PlayMode = "loop" | "single" | "random";
type LyricLine = { time: number; text: string };

type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
  lrc?: string;
  lyrics?: LyricLine[];
};

type LocalManifestTrack = {
  id?: unknown;
  name?: unknown;
  artist?: unknown;
  cover?: unknown;
  url?: unknown;
  lrcUrl?: unknown;
};

interface MusicContextType {
  playlist: MusicTrack[];
  currentIndex: number;
  currentSong: MusicTrack | undefined;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  playSong: (index: number) => void;
  selectSong: (index: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

function parseLrc(lrcText: string) {
  if (!lrcText || lrcText.length > 30000) return [];
  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];
  const tagPattern = /<\d{2}:\d{2}(?:\.\d{2,3})?>/g;
  const timePattern = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timePattern)];
    if (!matches.length) continue;

    let text = line.replace(timePattern, "").replace(tagPattern, "").trim();
    text = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "").trim();
    if (!text) continue;

    for (const match of matches) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3], 10) : 0;
      const divisor = match[3] && match[3].length === 3 ? 1000 : 100;
      result.push({ time: min * 60 + sec + ms / divisor, text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyric, setCurrentLyric] = useState("正在加载纳西妲歌单...");
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");

  const audioRef = useRef<HTMLAudioElement>(null);
  const localPlaylist = useMemo(() => {
    return (siteConfig.musicPlaylist || []).map((song) => ({
      id: song.id,
      title: song.name || "未知歌曲",
      artist: song.artist || "未知歌手",
      cover: song.cover || siteConfig.photoWallImage,
      src: song.url,
      lrc: song.lrc || "",
      lyrics: song.lrc ? parseLrc(song.lrc) : [],
    }));
  }, []);

  const loadManifestFallback = async () => {
    const response = await fetch("/music/manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Local music manifest unavailable");
    const payload: unknown = await response.json();
    const entries = Array.isArray(payload) ? payload : payload && typeof payload === "object" ? [payload] : [];
    const tracks = entries
      .filter((song): song is LocalManifestTrack => Boolean(song && typeof song === "object"))
      .map((song, index) => ({
        id: typeof song.id === "string" && song.id ? song.id : `local-track-${index + 1}`,
        title: typeof song.name === "string" && song.name ? song.name : `本地音轨 ${index + 1}`,
        artist: typeof song.artist === "string" && song.artist ? song.artist : "未知歌手",
        cover: typeof song.cover === "string" && song.cover ? song.cover : siteConfig.photoWallImage,
        src: typeof song.url === "string" ? song.url : "",
        lrc: "",
        lyrics: [],
        lrcUrl: typeof song.lrcUrl === "string" ? song.lrcUrl : "",
      }))
      .filter((song) => song.src);

    return Promise.all(
      tracks.map(async (track) => {
        if (!track.lrcUrl) return track;
        try {
          const lyricResponse = await fetch(track.lrcUrl, { cache: "no-store" });
          return lyricResponse.ok ? { ...track, lrc: await lyricResponse.text() } : track;
        } catch {
          return track;
        }
      }),
    );
  };

  useEffect(() => {
    let isMounted = true;

    const fetchMusicData = async () => {
      try {
        const ids = siteConfig.cloudMusicIds?.join(",");
        const endpoint = ids ? `/api/music?ids=${ids}` : "/api/music";
        const res = await fetch(endpoint);
        const rawResults = await res.json();
        const mergedPlaylist = rawResults
          .filter((song: any) => song && (song.url || song.src) && !song.error)
          .map((song: any) => ({
            id: song.id || Math.random().toString(36).slice(2),
            title: song.name || song.title || "未知歌曲",
            artist: song.artist || song.author || "未知歌手",
            cover: song.cover || song.pic || siteConfig.photoWallImage,
            src: song.url || song.src,
            lrc: song.lrc || "",
            lyrics: song.lrc ? parseLrc(song.lrc) : [],
          }));

        if (!isMounted) return;
        const finalPlaylist = Array.isArray(rawResults) ? mergedPlaylist : localPlaylist;
        setPlaylist(finalPlaylist);
        setCurrentLyric(finalPlaylist.length > 0 ? "本地歌单已就绪" : "暂无可播放歌曲");
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        try {
          const manifestPlaylist = await loadManifestFallback();
          if (!isMounted) return;
          setPlaylist(manifestPlaylist);
          setCurrentLyric(manifestPlaylist.length > 0 ? "已切换到本地歌单" : "暂无可播放歌曲");
        } catch {
          if (!isMounted) return;
          setPlaylist(localPlaylist);
          setCurrentLyric(localPlaylist.length > 0 ? "已切换到本地歌单" : "网络初始化失败");
        }
        setIsLoading(false);
      }
    };

    fetchMusicData();
    return () => {
      isMounted = false;
    };
  }, [localPlaylist]);

  useEffect(() => {
    if (!playlist.length) return;
    const currentSong = playlist[currentIndex];
    if (!currentSong) return;

    setLyrics([]);
    setCurrentLyric("正在缓冲...");

    if (currentSong.lyrics && currentSong.lyrics.length > 0) {
      setLyrics(currentSong.lyrics);
      setCurrentLyric(currentSong.lyrics[0]?.text || "纯享音乐");
    } else if (currentSong.lrc) {
      const parsed = parseLrc(currentSong.lrc);
      setLyrics(parsed);
      setCurrentLyric(parsed.length > 0 ? parsed[0].text : "纯享音乐");
    } else {
      setCurrentLyric("纯享音乐");
    }

    if (isPlaying && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise) playPromise.catch(() => setIsPlaying(false));
    }
  }, [currentIndex, playlist, isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current || !playlist.length) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => setIsPlaying(false));
    setIsPlaying((prev) => !prev);
  };

  const nextSong = () => {
    if (!playlist.length) return;
    if (playMode === "random") {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  const prevSong = () => {
    if (!playlist.length) return;
    if (playMode === "random") {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
      return;
    }
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const playSong = (index: number) => {
    if (!playlist.length) return;
    const nextIndex = Math.max(0, Math.min(index, playlist.length - 1));
    setCurrentIndex(nextIndex);
    if (!isPlaying) setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const { currentTime, duration } = audioRef.current;
    setCurrentTime(currentTime);
    setDuration(duration || 0);
    setProgress((currentTime / (duration || 1)) * 100);

    if (lyrics.length > 0) {
      const activeLyric = [...lyrics].reverse().find((line) => currentTime >= line.time);
      if (activeLyric && activeLyric.text !== currentLyric) {
        setCurrentLyric(activeLyric.text);
      }
    }
  };

  const handleEnded = () => {
    if (!audioRef.current || !playlist.length) return;
    if (playMode === "single") {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }
    nextSong();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted((prev) => !prev);

  const togglePlayMode = () => {
    setPlayMode((prev) => {
      if (prev === "loop") return "single";
      if (prev === "single") return "random";
      return "loop";
    });
  };

  const currentSong = playlist[currentIndex];

  return (
    <MusicContext.Provider
      value={{
        playlist,
        currentIndex,
        currentSong,
        isPlaying,
        progress,
        currentTime,
        duration,
        currentLyric,
        isLoading,
        volume,
        isMuted,
        playMode,
        togglePlay,
        nextSong,
        prevSong,
        handleSeek,
        playSong,
        selectSong: playSong,
        setVolume,
        toggleMute,
        togglePlayMode,
      }}
    >
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.src}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleTimeUpdate}
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
};
