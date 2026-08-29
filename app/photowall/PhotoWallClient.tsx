"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";

type Photo = {
  url: string;
  caption: string;
  name: string;
};

export default function PhotoWallClient({ photos }: { photos: Photo[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

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
          <section className="mb-8 rounded-[28px] border border-white/40 bg-white/50 p-6 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/35">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
                纳西妲 Photo Wall
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 dark:text-white">照片墙</h1>
              <div className="mt-4 text-sm font-bold text-slate-600 dark:text-slate-300">共 {photos.length} 张</div>

              <div className="mx-auto mt-6 max-w-3xl">
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
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={() => setSelectedPhoto(null)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
          <div className="absolute bottom-8 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-md">
            {selectedPhoto.caption}
          </div>
        </div>
      )}
    </div>
  );
}
