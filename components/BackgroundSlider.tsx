"use client";
import { useState, useEffect } from 'react';
import { siteConfig } from '../siteConfig';

export default function BackgroundSlider() {
  const [index, setIndex] = useState(0);
  const [images, setImages] = useState(siteConfig.bgImages);

  useEffect(() => {
    let cancelled = false;

    fetch("/nahida/manifest.json", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        const candidates = Array.isArray(payload)
          ? payload
          : payload && typeof payload === "object" && "images" in payload && Array.isArray(payload.images)
            ? payload.images
            : [];
        const syncedImages = candidates.filter(
          (image): image is string => typeof image === "string" && image.length > 0
        );

        if (!cancelled && syncedImages.length > 0) {
          setImages(syncedImages);
          setIndex(0);
        }
      })
      .catch(() => {
        // Keep the fixed theme images when the optional manifest is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 10000); // 10秒切换一次

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0 z-[-10] overflow-hidden">
      {images.map((img, i) => (
        <div
          key={img}
          className="background-slider-layer absolute inset-0 transition-opacity duration-[2000ms] ease-in-out transform-gpu"
          style={{
            backgroundImage: `url(${img})`,
            filter: 'saturate(1.08) brightness(1) contrast(1.08)',
            // 当前显示的图片 opacity 为 1，其他的为 0
            opacity: i === index ? 1 : 0,
            // 解决层级重叠导致的渲染压力
            visibility: Math.abs(i - index) <= 1 || (i === images.length - 1 && index === 0) ? 'visible' : 'hidden'
          }}
        />
      ))}
    </div>
  );
}
