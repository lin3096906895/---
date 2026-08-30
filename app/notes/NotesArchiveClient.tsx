"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";

type NoteItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  source_path: string;
  category: string;
  published_at: string | Date;
};

type NotesStats = {
  total: number;
  tags: { name: string; count: number }[];
};

export default function NotesArchiveClient({
  initialItems,
  initialStats,
}: {
  initialItems: NoteItem[];
  initialStats: NotesStats;
}) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  const tagOptions = useMemo(() => ["All", ...initialStats.tags.map((item) => item.name)], [initialStats.tags]);

  const formatDate = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialItems.filter((item) => {
      const matchTag = selectedTag === "All" || item.tags.includes(selectedTag);
      const matchQuery =
        q === "" ||
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchTag && matchQuery;
    });
  }, [initialItems, query, selectedTag]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-10">
      <section className="mb-8 rounded-[24px] border border-white/30 bg-white/35 p-5 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/28">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">笔记归档</h1>
            <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
              <BookOpen size={16} />
              共 {initialStats.total} 篇
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、摘要、分类或标签..."
              className="w-full rounded-full border border-white/40 bg-white/55 py-3 pl-12 pr-4 text-slate-800 shadow-sm outline-none backdrop-blur-md placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-800/50 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tagName) => (
              <button
                key={tagName}
                onClick={() => setSelectedTag(tagName)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  selectedTag === tagName
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-white/60 text-slate-600 hover:bg-white dark:bg-slate-800/60 dark:text-slate-300"
                }`}
              >
                {tagName}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {filteredItems.map((item) => (
          <article
            key={item.id}
            className="group overflow-hidden rounded-[24px] border border-white/35 bg-white/60 shadow-lg transition-transform hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/42"
          >
            <div className="relative aspect-[16/7] overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(236,253,245,0.65),rgba(16,185,129,0.18))]" />
              <div className="absolute left-4 top-4 flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="rounded-md bg-white/75 px-2 py-1 text-emerald-800 backdrop-blur dark:bg-slate-950/45 dark:text-emerald-200">
                  {item.category}
                </span>
                <span className="rounded-md bg-white/75 px-2 py-1 text-slate-700 backdrop-blur dark:bg-slate-950/45 dark:text-slate-200">
                  {formatDate(item.published_at)}
                </span>
              </div>
            </div>

            <div className="p-5">
              <h2 className="mb-3 text-[1.1rem] font-black text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                {item.title}
              </h2>

              <p className="mb-5 min-h-[72px] line-clamp-3 text-sm leading-relaxed text-slate-700 font-serif dark:text-slate-300">
              {item.excerpt}
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
                {item.tags.map((tagName) => (
                  <span
                    key={tagName}
                    className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300"
                  >
                    {tagName}
                  </span>
                ))}
              </div>

              <div className="truncate text-xs text-slate-400">{item.source_path}</div>
            </div>
          </article>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full rounded-3xl border border-white/40 bg-white/45 p-8 text-center text-slate-500 dark:border-white/10 dark:bg-slate-900/40">
            没有找到匹配的笔记。
          </div>
        )}
      </div>
    </div>
  );
}
