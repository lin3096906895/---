import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FolderOpen, Hash, Sparkles } from "lucide-react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import "highlight.js/styles/atom-one-dark.css";

import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import { siteConfig } from "../../../siteConfig";
import { getNoteArchiveBySlug } from "../../../lib/notes-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeSlug(value: string | string[]) {
  const decodePart = (part: string) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  };

  return Array.isArray(value) ? value.map(decodePart).join("/") : decodePart(value);
}

function pickNahidaCover(slug: string) {
  const covers = ["/nahida/bg-1.jpg", "/nahida/bg-2.jpg", "/nahida/bg-3.jpg"];
  const hash = slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return covers[hash % covers.length];
}

async function renderMarkdown(content: string) {
  const normalized = content.replace(/\r\n/g, "\n").replace(/^[ \t]+$/gm, "");
  const processed = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    // @ts-expect-error rehype-highlight's options type is narrower than the runtime accepts
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
      subset: ["cpp", "c", "python", "java", "javascript", "typescript", "go", "rust", "bash", "json", "html", "css", "sql", "xml"],
    })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(normalized);

  return processed.toString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const noteSlug = normalizeSlug(slug);
  const note = await getNoteArchiveBySlug(noteSlug);

  if (!note) {
    return {
      title: `未找到笔记 | ${siteConfig.title}`,
    };
  }

  return {
    title: `${note.title} | ${siteConfig.title}`,
    description: note.excerpt,
  };
}

export default async function NoteDetail({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const noteSlug = normalizeSlug(slug);
  const note = await getNoteArchiveBySlug(noteSlug);

  if (!note) {
    notFound();
  }

  const contentHtml = await renderMarkdown(note.content);
  const cover = pickNahidaCover(note.slug);

  return (
    <div className="relative min-h-screen pb-20">
      <Navbar />
      <PageTransition>
        <main className="mx-auto mt-24 flex w-[95%] max-w-6xl flex-col gap-6 px-0 md:mt-28 lg:flex-row lg:gap-8">
          <article className="flex-1 overflow-hidden rounded-[36px] border border-white/40 bg-white/60 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/50">
            <div className="relative aspect-[16/7] w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              <Image
                src={cover}
                alt="笔记封面"
                fill
                sizes="100vw"
                className="object-cover opacity-90 transition-transform duration-1000 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
            </div>

            <div className="p-5 md:p-12">
              <div className="mb-6 flex items-center justify-between gap-4">
                <Link
                  href="/notes"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
                >
                  <ArrowLeft size={16} />
                  返回列表
                </Link>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                  <Sparkles size={14} />
                  Note Detail
                </div>
              </div>

              <header className="mb-8 border-b border-slate-200/70 pb-6 dark:border-slate-700/70">
                <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">
                    {note.category}
                  </span>
                  <span className="rounded-md bg-slate-500/10 px-2 py-1 text-slate-600 dark:text-slate-300">
                    {formatDate(note.published_at)}
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                  {note.title}
                </h1>

                <div className="mt-5 flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                    >
                      <Hash size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              </header>

              <div className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 transition-colors duration-700 dark:text-slate-200">
                <style>{`
                  .prose h1 { font-size: 1.9rem !important; font-weight: 900 !important; margin-bottom: 1.2rem !important; margin-top: 2rem !important; line-height: 1.3 !important; color: inherit !important; }
                  .prose h2 { font-size: 1.5rem !important; font-weight: 800 !important; margin-bottom: 1rem !important; margin-top: 1.6rem !important; color: inherit !important; }
                  .prose h3 { font-size: 1.2rem !important; font-weight: 700 !important; margin-bottom: 0.8rem !important; color: inherit !important; }
                  .prose p { font-size: 0.98rem !important; line-height: 1.8 !important; color: inherit !important; }
                  .prose a { color: #059669 !important; text-decoration: none !important; font-weight: 700 !important; border-bottom: 1px dashed #059669 !important; }
                  .dark .prose a { color: #6ee7b7 !important; border-bottom-color: #6ee7b7 !important; }
                  .prose ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
                  .prose ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
                  .prose li { display: list-item !important; margin-bottom: 0.45rem !important; }
                  .prose blockquote {
                    border-left: 4px solid #10b981 !important;
                    background-color: rgba(16, 185, 129, 0.06) !important;
                    padding: 1rem 1.2rem !important;
                    margin: 1.5rem 0 !important;
                    border-radius: 0 1rem 1rem 0 !important;
                    color: #475569 !important;
                  }
                  .dark .prose blockquote {
                    background-color: rgba(16, 185, 129, 0.1) !important;
                    color: #cbd5e1 !important;
                  }
                  .prose pre {
                    background: linear-gradient(180deg, rgba(247, 255, 250, 0.98), rgba(236, 253, 245, 0.96)) !important;
                    color: #0f172a !important;
                    padding: 1rem !important;
                    border-radius: 1rem !important;
                    overflow-x: auto !important;
                    border: 1px solid rgba(16, 185, 129, 0.14) !important;
                    box-shadow: 0 18px 40px rgba(16, 185, 129, 0.08) !important;
                  }
                  .dark .prose pre {
                    background: linear-gradient(180deg, rgba(3, 21, 18, 0.92), rgba(6, 39, 29, 0.9)) !important;
                    color: #d1fae5 !important;
                    border-color: rgba(110, 231, 183, 0.18) !important;
                    box-shadow: 0 18px 40px rgba(2, 6, 23, 0.35) !important;
                  }
                  .prose pre code { background: transparent !important; padding: 0 !important; color: inherit !important; }
                  .prose code::before, .prose code::after { content: none !important; }
                  .prose p code, .prose li code {
                    background-color: rgba(16, 185, 129, 0.12) !important;
                    color: #047857 !important;
                    padding: 0.1rem 0.35rem !important;
                    border-radius: 0.35rem !important;
                    font-weight: 700 !important;
                  }
                  .dark .prose p code, .dark .prose li code {
                    background-color: rgba(16, 185, 129, 0.2) !important;
                    color: #6ee7b7 !important;
                  }
                  .prose img {
                    display: block !important;
                    max-width: 100% !important;
                    height: auto !important;
                    margin: 1.5rem auto !important;
                    border-radius: 1rem !important;
                  }
                  .prose pre code .hljs-comment, .prose pre code .hljs-quote { color: #6b7280 !important; font-style: italic !important; }
                  .prose pre code .hljs-doctag, .prose pre code .hljs-keyword, .prose pre code .hljs-formula { color: #8b5cf6 !important; }
                  .prose pre code .hljs-keyword.type_, .prose pre code .hljs-type { color: #7c3aed !important; }
                  .prose pre code .hljs-section, .prose pre code .hljs-name, .prose pre code .hljs-selector-tag, .prose pre code .hljs-deletion, .prose pre code .hljs-subst { color: #ef4444 !important; }
                  .prose pre code .hljs-literal { color: #0ea5e9 !important; }
                  .prose pre code .hljs-string, .prose pre code .hljs-regexp, .prose pre code .hljs-addition, .prose pre code .hljs-attribute, .prose pre code .hljs-meta-string { color: #16a34a !important; }
                  .prose pre code .hljs-built_in, .prose pre code .hljs-class .hljs-title, .prose pre code .hljs-title.class_ { color: #ca8a04 !important; }
                  .prose pre code .hljs-attr, .prose pre code .hljs-variable, .prose pre code .hljs-template-variable, .prose pre code .hljs-selector-class, .prose pre code .hljs-selector-attr, .prose pre code .hljs-selector-pseudo, .prose pre code .hljs-number { color: #ea580c !important; }
                  .prose pre code .hljs-symbol, .prose pre code .hljs-bullet, .prose pre code .hljs-link, .prose pre code .hljs-meta, .prose pre code .hljs-selector-id, .prose pre code .hljs-title, .prose pre code .hljs-title.function_ { color: #0f766e !important; }
                `}</style>
                <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
              </div>
            </div>
          </article>

          <aside className="w-full flex-shrink-0 lg:w-[320px]">
            <div className="rounded-[28px] border border-white/40 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/50">
              <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <FolderOpen size={16} />
                文章信息
              </div>
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">发布时间</div>
                  <div className="mt-1 flex items-center gap-2 font-medium">
                    <CalendarDays size={14} />
                    {formatDate(note.published_at)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">分类</div>
                  <div className="mt-1">{note.category}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">来源路径</div>
                  <div className="mt-1 break-all text-xs">{note.source_path}</div>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </PageTransition>
    </div>
  );
}
