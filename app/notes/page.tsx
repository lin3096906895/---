import Image from "next/image";
import Link from "next/link";
import { BookOpen, Search, ArrowRight, X } from "lucide-react";

import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { siteConfig } from "../../siteConfig";
import { getNotesArchiveStats, listNotesArchive } from "../../lib/notes-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "笔记归档 | " + siteConfig.title,
  description: "笔记归档与检索",
};

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const lower = text.toLowerCase();
  const search = query.toLowerCase();
  const index = lower.indexOf(search);
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-md bg-emerald-300/70 px-1 text-slate-900">{text.slice(index, index + search.length)}</mark>
      {text.slice(index + search.length)}
    </>
  );
}

function buildHref(query: string, tag: string) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (tag.trim()) params.set("tag", tag.trim());
  const search = params.toString();
  return search ? `/notes?${search}` : "/notes";
}

function buildNoteHref(slug: string) {
  return `/notes/${slug.split("/").map(encodeURIComponent).join("/")}`;
}

function pickNahidaCover(slug: string) {
  const covers = ["/nahida/bg-1.jpg", "/nahida/bg-2.jpg", "/nahida/bg-3.jpg"];
  const hash = slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return covers[hash % covers.length];
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = firstParam(resolvedSearchParams.q);
  const selectedTag = firstParam(resolvedSearchParams.tag);

  const [items, stats] = await Promise.all([
    listNotesArchive({ query, tag: selectedTag, limit: 100 }),
    getNotesArchiveStats(),
  ]);

  const activeTag = selectedTag || "All";

  return (
    <div className="relative min-h-screen pb-20">
      <Navbar />
      <PageTransition>
        <div className="mx-auto mt-24 w-full max-w-6xl px-4 sm:px-10">
          <section className="mb-8 rounded-[24px] border border-white/30 bg-white/35 p-5 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/28">
            <div className="mx-auto flex max-w-4xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">笔记归档</h1>
                <div className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 md:justify-start">
                  <BookOpen size={16} />
                  共 {stats.total} 篇
                </div>
              </div>

              <form className="flex w-full flex-col gap-3 md:max-w-xl" action="/notes" method="get">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="搜索标题、摘要、正文、标签..."
                    className="w-full rounded-full border border-white/35 bg-white/70 py-3 pl-12 pr-10 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-800/55 dark:text-white"
                  />
                  {query ? (
                    <Link
                      href={buildHref("", activeTag === "All" ? "" : activeTag)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                      aria-label="清除搜索"
                    >
                      <X size={16} />
                    </Link>
                  ) : null}
                </div>
              </form>
            </div>
          </section>

          <div className="mb-5 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Link
              href={buildHref(query, "")}
              className={`rounded-full px-4 py-2 transition-all ${
                activeTag === "All"
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-white/60 text-slate-600 hover:bg-white dark:bg-slate-800/60 dark:text-slate-300"
              }`}
            >
              全部
            </Link>
            {stats.tags.map((item) => (
              <Link
                key={item.name}
                href={buildHref(query, item.name)}
                className={`rounded-full px-4 py-2 transition-all ${
                  activeTag === item.name
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-white/60 text-slate-600 hover:bg-white dark:bg-slate-800/60 dark:text-slate-300"
                }`}
              >
                {item.name} · {item.count}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-[24px] border border-white/35 bg-white/60 shadow-lg transition-transform hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/42"
              >
                <div className="relative aspect-[16/7] overflow-hidden">
                  <Image
                    src={pickNahidaCover(item.slug)}
                    alt="纳西妲封面"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-[center_18%] transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-emerald-950/10 to-transparent" />
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
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <h2 className="text-[1.1rem] font-black leading-tight text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                      <Link href={buildNoteHref(item.slug)}>{highlight(item.title, query)}</Link>
                    </h2>

                    <Link
                      href={buildNoteHref(item.slug)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 transition-colors hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
                      aria-label="查看详情"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                  <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-700 font-serif dark:text-slate-300">
                    {highlight(item.excerpt, query)}
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.tags.map((tagName) => (
                      <Link
                        key={tagName}
                        href={buildHref(query, tagName)}
                        className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
                      >
                        {tagName}
                      </Link>
                    ))}
                  </div>

                  <Link href={buildNoteHref(item.slug)} className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    阅读全文
                  </Link>
                </div>
              </article>
            ))}

            {items.length === 0 && (
              <div className="col-span-full rounded-3xl border border-white/40 bg-white/45 p-8 text-center text-slate-500 dark:border-white/10 dark:bg-slate-900/40">
                没有找到匹配的笔记。
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
