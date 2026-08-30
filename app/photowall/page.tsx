import fs from "fs";
import path from "path";

import { siteConfig } from "../../siteConfig";
import PhotoWallClient from "./PhotoWallClient";

export const dynamic = "force-dynamic";

function loadPhotos() {
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

export const metadata = {
  title: "照片墙 | " + siteConfig.title,
};

export default function PhotoWallPage() {
  return <PhotoWallClient photos={loadPhotos()} />;
}
