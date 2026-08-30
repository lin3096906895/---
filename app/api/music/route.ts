import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/siteConfig";
import { hasLocalMusicManifest, loadLocalMusic } from "@/lib/local-music";

type SongResult = {
  id: string;
  name?: string;
  artist?: string;
  author?: string;
  cover?: string;
  pic?: string;
  url?: string;
  src?: string;
  lrc?: string;
  searchQuery?: string;
  error?: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchLyrics(trackName: string, artistName: string) {
  const query = new URLSearchParams({ track_name: trackName, artist_name: artistName });
  const res = await fetch(`https://lrclib.net/api/search?${query.toString()}`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return "";
  const results = await res.json();
  const first = Array.isArray(results) ? results[0] : null;
  return first?.syncedLyrics || first?.plainLyrics || "";
}

export async function GET(request: NextRequest) {
  const configuredPlaylist = (siteConfig.musicPlaylist || []).map((song) => ({
    id: song.id,
    name: song.name,
    artist: song.artist,
    author: song.artist,
    cover: song.cover,
    pic: song.cover,
    url: song.url,
    src: song.url,
    lrc: song.lrc || "",
    searchQuery: song.searchQuery,
  }));
  const syncedPlaylist = loadLocalMusic().map((song) => ({
    id: song.id,
    name: song.name,
    artist: song.artist,
    author: song.artist,
    cover: song.cover,
    pic: song.cover,
    url: song.url,
    src: song.url,
    lrc: song.lrc,
    searchQuery: song.searchQuery,
  }));
  const localPlaylist = hasLocalMusicManifest() ? syncedPlaylist : configuredPlaylist;

  if (siteConfig.musicSource === "local" || localPlaylist.length > 0) {
    const withLyrics: SongResult[] = await Promise.all(
      localPlaylist.map(async (song) => {
        if (song.lrc) return song;
        const fallbackQuery =
          localPlaylist.find((item) => item.id === song.id)?.searchQuery ||
          `${song.name || ""} ${song.artist || ""}`;
        try {
          const lrc = await fetchLyrics(song.name || fallbackQuery, song.artist || "");
          return { ...song, lrc };
        } catch {
          return song;
        }
      }),
    );
    return NextResponse.json(withLyrics, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const ids = request.nextUrl.searchParams.get("ids");
  if (!ids) return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });

  const songIds = ids.split(",").map((id) => id.trim()).filter(Boolean);
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    Referer: "https://music.163.com/",
  };

  const results: SongResult[] = await Promise.all(
    songIds.map(async (songId): Promise<SongResult> => {
      try {
        const [detailRes, lrcRes] = await Promise.all([
          fetch(`https://music.163.com/api/song/detail/?id=${songId}&ids=[${songId}]`, {
            headers,
            signal: AbortSignal.timeout(6000),
          }),
          fetch(`https://music.163.com/api/song/lyric?id=${songId}&lv=-1&kv=-1&tv=-1`, {
            headers,
            signal: AbortSignal.timeout(6000),
          }).catch(() => null),
        ]);

        const detail = await detailRes.json();
        const song = detail.songs?.[0];
        if (!song) return { id: songId, error: "not_found" };

        let lrcText = "";
        if (lrcRes && lrcRes.ok) {
          try {
            const lrcData = await lrcRes.json();
            lrcText = lrcData.lrc?.lyric || "";
          } catch {
            /* ignore lyric failures */
          }
        }

        const artistName = song.artists?.[0]?.name || "未知歌手";
        return {
          id: songId,
          name: song.name,
          artist: artistName,
          author: artistName,
          cover: song.album?.picUrl || "",
          pic: song.album?.picUrl || "",
          url: `https://music.163.com/song/media/outer/url?id=${songId}.mp3`,
          lrc: lrcText,
        };
      } catch (error) {
        console.error(`[api/music] 获取歌曲 ${songId} 失败:`, error);
        return { id: songId, error: String(error) };
      }
    }),
  );

  return NextResponse.json(results);
}
