import fs from "fs";
import path from "path";
import iconv from "iconv-lite";

export type LocalMusicTrack = {
  id: string;
  name: string;
  artist: string;
  cover: string;
  url: string;
  lrc: string;
  searchQuery?: string;
};

type ManifestEntry = {
  id?: unknown;
  name?: unknown;
  title?: unknown;
  artist?: unknown;
  cover?: unknown;
  url?: unknown;
  lrcFile?: unknown;
  searchQuery?: unknown;
};

function getManifestPath() {
  return path.join(process.cwd(), "public", "music", "manifest.json");
}

export function hasLocalMusicManifest() {
  return fs.existsSync(getManifestPath());
}

function readManifest(): ManifestEntry[] {
  const manifestPath = getManifestPath();
  if (!fs.existsSync(manifestPath)) return [];

  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const entries = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
    return entries.filter((entry): entry is ManifestEntry => Boolean(entry && typeof entry === "object"));
  } catch {
    return [];
  }
}

function readLyricFile(musicRoot: string, lyricFile: unknown) {
  if (typeof lyricFile !== "string" || !lyricFile) return "";

  const lyricPath = path.join(musicRoot, path.basename(lyricFile));
  if (!fs.existsSync(lyricPath)) return "";

  try {
    const buffer = fs.readFileSync(lyricPath);
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      return iconv.decode(buffer, "utf16le").replace(/^\uFEFF/, "");
    }

    const candidates = ["utf8", "gb18030", "utf16le"];
    return candidates
      .map((encoding) => iconv.decode(buffer, encoding))
      .sort((a, b) => {
        const score = (text: string) =>
          (text.match(/\uFFFD/g)?.length || 0) * 1000 + (text.match(/\u0000/g)?.length || 0);
        return score(a) - score(b);
      })[0]
      .replace(/^\uFEFF/, "");
  } catch {
    return "";
  }
}

export function loadLocalMusic(): LocalMusicTrack[] {
  const musicRoot = path.join(process.cwd(), "public", "music");
  return readManifest()
    .map((entry, index) => {
      const url = typeof entry.url === "string" ? entry.url : "";
      if (!url) return null;

      const name = typeof entry.name === "string" && entry.name ? entry.name : `本地音轨 ${index + 1}`;
      const artist = typeof entry.artist === "string" && entry.artist ? entry.artist : "未知歌手";
      const cover = typeof entry.cover === "string" && entry.cover ? entry.cover : "/nahida/bg-2.jpg";
      const id = typeof entry.id === "string" && entry.id ? entry.id : `local-track-${index + 1}`;

      return {
        id,
        name,
        artist,
        cover,
        url,
        lrc: readLyricFile(musicRoot, entry.lrcFile),
        searchQuery: typeof entry.searchQuery === "string" ? entry.searchQuery : `${name} ${artist}`,
      };
    })
    .filter((track): track is LocalMusicTrack => track !== null);
}
