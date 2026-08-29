import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, FolderOpen, Search, Tag, ArrowRight, Sparkles, X } from "lucide-react";

import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { siteConfig } from "../../siteConfig";
import { getNotesArchiveStats, listNotesArchive } from "../../lib/notes-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "笔记归档 | " + siteConfig.title,
  description: "本地 Markdown 笔记导入后的在线检索归档库",
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
        <div className="mx-auto mt-28 w-full max-w-6xl px-4 sm:px-10">
          <section className="mb-8 overflow-hidden rounded-[28px] border border-white/40 bg-white/50 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
            <div className="relative">
              <div className="absolute inset-0">
                <Image
                  src="/nahida/bg-2.jpg"
                  alt="notes background"
                  fill
                  sizes="100vw"
                  className="object-cover opacity-20 dark:opacity-12"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/90 via-white/70 to-white/20 dark:from-emerald-950/80 dark:via-slate-950/70 dark:to-slate-950/20" />
              </div>

              <div className="relative p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
                      <Sparkles size={12} />
                      Notes Archive
                    </div>
                    <h1 className="text-4xl font-black tracking-widest text-slate-900 dark:text-white">笔记归档</h1>
                    <p className="mt-3 max-w-2xl font-serif text-slate-600 dark:text-slate-300">
                      本地 Markdown 笔记已导入数据库，可以按标题、摘要、正文和标签快速搜索，也可以点进单篇详情继续看。
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <BookOpen size={16} />
                    共 {stats.total} 篇
                  </div>
                </div>

                <form className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center" action="/notes" method="get">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      name="q"
                      defaultValue={query}
                      placeholder="搜索标题、摘要、正文或标签..."
                      className="w-full rounded-full border border-white/40 bg-white/70 py-3 pl-12 pr-4 text-slate-800 shadow-sm outline-none backdrop-blur-md placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-800/55 dark:text-white"
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
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition-transform hover:-translate-y-0.5"
                  >
                    <Search size={16} />
                    搜索
                  </button>
                </form>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={buildHref(query, "")}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      activeTag === "All"
                        ? "bg-emerald-500 text-white shadow-md"
                        : "bg-white/65 text-slate-600 hover:bg-white dark:bg-slate-800/65 dark:text-slate-300"
                    }`}
                  >
                    All
                  </Link>
                  {stats.tags.map((item) => (
                    <Link
                      key={item.name}
                      href={buildHref(query, item.name)}
                      className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                        activeTag === item.name
                          ? "bg-emerald-500 text-white shadow-md"
                          : "bg-white/65 text-slate-600 hover:bg-white dark:bg-slate-800/65 dark:text-slate-300"
                      }`}
                    >
                      {item.name} · {item.count}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="mb-8 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <FolderOpen size={15} /> 数据库检索
            </span>
            <span className="flex items-center gap-2">
              <Tag size={15} /> 标签过滤
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays size={15} /> 按发布时间排序
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="group rounded-3xl border border-white/40 bg-white/60 p-6 shadow-xl backdrop-blur-xl transition-transform hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/45"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">
                        {item.category}
                      </span>
                      <span className="rounded-md bg-slate-500/10 px-2 py-1 text-slate-600 dark:text-slate-300">
                        {formatDate(item.published_at)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                      <Link href={buildNoteHref(item.slug)}>{highlight(item.title, query)}</Link>
                    </h2>
                  </div>

                  <Link
                    href={buildNoteHref(item.slug)}
                    className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 transition-colors hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
                    aria-label="查看详情"
                  >
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <p className="mb-5 min-h-[72px] line-clamp-3 text-sm leading-relaxed text-slate-700 font-serif dark:text-slate-300">
                  {highlight(item.excerpt, query)}
                </p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {item.tags.map((tagName) => (
                    <Link
                      key={tagName}
                      href={buildHref(query, tagName)}
                      className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
                    >
                      {tagName}
                    </Link>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="truncate text-xs text-slate-400">{item.source_path}</div>
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
