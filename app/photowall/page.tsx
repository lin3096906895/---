import { siteConfig } from "../../siteConfig";
import { loadNahidaPhotos } from "../../lib/nahida-photos";
import PhotoWallClient from "./PhotoWallClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "照片墙 | " + siteConfig.title,
};

export default function PhotoWallPage() {
  return <PhotoWallClient photos={loadNahidaPhotos()} />;
}
