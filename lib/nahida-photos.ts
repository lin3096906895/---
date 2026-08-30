import fs from "fs";
import path from "path";

export type NahidaPhoto = {
  url: string;
  caption: string;
  name: string;
  featured: boolean;
};

export function loadNahidaPhotos(): NahidaPhoto[] {
  const photosRoot = path.join(process.cwd(), "public", "photowall", "nahida");
  if (!fs.existsSync(photosRoot)) return [];

  return fs
    .readdirSync(photosRoot)
    .filter((name) => /\.(png|jpe?g|webp|gif)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))
    .map((name, index) => ({
      url: `/photowall/nahida/${encodeURIComponent(name)}`,
      caption: `纳西妲照片 ${String(index + 1).padStart(2, "0")}`,
      name,
      featured: index < 3,
    }));
}
