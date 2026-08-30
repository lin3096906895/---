"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";

type Photo = {
  url: string;
  caption: string;
  name: string;
  featured?: boolean;
};

export default function PhotoWallClient({ photos }: { photos: Photo[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const featuredPhotos = useMemo(() => photos.filter((photo) => photo.featured).slice(0, 3), [photos]);

  const filteredPhotos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return photos;
    return photos.filter((photo) => photo.caption.toLowerCase().includes(q) || photo.name.toLowerCase().includes(q));
  }, [photos, searchQuery]);

  return (
    <div className="min-h-screen pb-20">
      <Navbar />

      <PageTransition>
        <div className="mx-auto mt-28 w-full max-w-7xl px-4 sm:px-10">
          <section className="mb-8 overflow-hidden rounded-[28px] border border-white/40 bg-white/55 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/35">
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
                  纳西妲 Photo Wall
                </div>
                <div className="mt-6">
                  <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">照片墙</h1>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                    收集一些我喜欢的纳西妲照片，慢慢堆成一面更完整的墙。
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
                  <span className="rounded-full border border-white/40 bg-white/55 px-3 py-1 dark:border-white/10 dark:bg-slate-800/50">共 {photos.length} 张</span>
                  <span className="rounded-full border border-white/40 bg-white/55 px-3 py-1 dark:border-white/10 dark:bg-slate-800/50">可搜索</span>
                  <span className="rounded-full border border-white/40 bg-white/55 px-3 py-1 dark:border-white/10 dark:bg-slate-800/50">点击查看大图</span>
                </div>
              </div>

              <div className="grid gap-2 p-3 sm:grid-cols-3 sm:gap-3 sm:p-4">
                {featuredPhotos.map((photo, index) => (
                  <button
                    key={photo.url}
                    type="button"
                    onClick={() => setSelectedPhoto(photo)}
                    className={`relative min-h-[140px] overflow-hidden rounded-[22px] border border-white/30 bg-slate-100 shadow-lg ${index === 0 ? "sm:col-span-3 sm:min-h-[220px]" : ""}`}
                  >
                    <img src={photo.url} alt={photo.caption} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">精选</div>
                      <div className="mt-1 text-sm font-bold text-white">{photo.caption}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/30 px-6 py-4 sm:px-8 dark:border-white/10">
              <div className="mx-auto max-w-3xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索照片名..."
                  className="w-full rounded-full border border-white/40 bg-white/75 px-5 py-3 text-slate-800 shadow-sm outline-none backdrop-blur-md placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-800/55 dark:text-white"
                />
              </div>
            </div>
          </section>

          <div className="columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-3 xl:columns-4">
            {filteredPhotos.map((photo) => (
              <button
                key={photo.url}
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                className="group block w-full break-inside-avoid overflow-hidden rounded-[22px] border border-white/40 bg-white/60 shadow-lg backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/35"
              >
                <div className="relative overflow-hidden">
                  <img src={photo.url} alt={photo.caption} className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="flex items-center justify-between gap-3 p-3 text-left">
                  <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">{photo.caption}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{photo.name.split(".").pop()}</span>
                </div>
              </button>
            ))}

            {filteredPhotos.length === 0 && (
              <div className="col-span-full rounded-[22px] border border-white/40 bg-white/45 p-8 text-center text-slate-500 dark:border-white/10 dark:bg-slate-900/35">
                没有找到匹配的照片。
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/95 p-4 backdrop-blur-2xl"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full border border-white/15 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={() => setSelectedPhoto(null)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption}
              className="max-h-[82vh] max-w-full rounded-[26px] border border-white/10 object-contain shadow-2xl"
            />
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 rounded-full border border-white/15 bg-black/35 px-5 py-2 text-sm font-medium text-white backdrop-blur-md">
              {selectedPhoto.caption}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
