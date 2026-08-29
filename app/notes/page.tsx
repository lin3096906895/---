import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { siteConfig } from "../../siteConfig";
import { getNotesArchiveStats, listNotesArchive } from "../../lib/notes-db";

export const runtime = "nodejs";

export const metadata = {
  title: "笔记归档 | " + siteConfig.title,
  description: "本地 Markdown 笔记导入后的在线检索归档库",
};

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default async function NotesPage() {
  const [items, stats] = await Promise.all([
    listNotesArchive({ limit: 100 }),
    getNotesArchiveStats(),
  ]);

  return (
    <div className="relative min-h-screen pb-20">
      <Navbar />
      <PageTransition>
        <div className="mx-auto mt-28 w-full max-w-6xl px-4 sm:px-10">
          <section className="mb-8 rounded-[28px] border border-white/40 bg-white/50 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-widest text-slate-900 dark:text-white">笔记归档</h1>
                <p className="mt-3 max-w-2xl font-serif text-slate-600 dark:text-slate-400">
                  本地 Markdown 笔记已导入数据库。这里展示标题、摘要、标签和分类，方便快速检索。
                </p>
              </div>
              <div className="text-sm font-bold text-slate-500">
                共 {stats.total} 篇
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-white/40 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45"
              >
                <div className="mb-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">
                    {item.category}
                  </span>
                  <span className="rounded-md bg-slate-500/10 px-2 py-1 text-slate-600 dark:text-slate-300">
                    {formatDate(item.published_at)}
                  </span>
                </div>
                <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h2>
                <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-700 font-serif dark:text-slate-300">
                  {item.excerpt}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="truncate text-xs text-slate-400">
                  {item.source_path}
                </div>
              </article>
            ))}
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
