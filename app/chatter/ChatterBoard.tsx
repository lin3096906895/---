"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../../siteConfig';

type Chatter = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  mood?: string;
  cover?: string;
  content: string;
};

export default function ChatterBoard({ chatters }: { chatters: Chatter[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("全部");

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    chatters.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return ["全部", ...Array.from(tags)];
  }, [chatters]);

  const filteredChatters = useMemo(() => {
    if (searchQuery.length > 0 && searchQuery.trim() === "") return [];
    const query = searchQuery.trim().toLowerCase();

    return chatters.filter(chatter => {
      const matchSearch = chatter.title.toLowerCase().includes(query) ||
                          chatter.content.toLowerCase().includes(query);
      const matchTag = activeTag === "全部" || chatter.tags?.includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [chatters, searchQuery, activeTag]);

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-8 py-6 md:py-10 pt-24 md:pt-28 relative z-10">

      <div className="mb-8 md:mb-14 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-tighter">
          {siteConfig.chatterTitle || "源石研究笔记"}
        </h1>
        <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium italic opacity-80">
          “ {siteConfig.chatterDescription || "随手记录的一点想法"} ”
        </p>
      </div>

      <div className="mb-8 md:mb-12 flex flex-col items-center gap-5 md:gap-8">
        <div className="relative w-full max-w-lg group px-2 md:px-0">
          <input
            type="text"
            placeholder="搜索杂谈..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 pl-10 md:pl-14 text-sm md:text-base text-slate-800 dark:text-white shadow-lg md:shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 font-medium"
          />
          <svg className="w-4 h-4 md:w-6 md:h-6 absolute left-5 md:left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 px-2 md:px-0">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 md:px-5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all duration-500 border ${
                activeTag === tag 
                ? 'bg-indigo-500 text-white border-indigo-500 shadow-md md:shadow-lg md:shadow-indigo-500/30 scale-105' 
                : 'bg-white/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {tag === "全部" ? tag : `# ${tag}`}
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="flex flex-col gap-5 md:gap-6">
        <AnimatePresence mode='popLayout'>
          {filteredChatters.map((chatter) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={chatter.slug}
              className="w-full"
            >
              <Link
                href={`/chatter/${chatter.slug}`}
                className="group relative block overflow-hidden rounded-[24px] border border-white/40 bg-white/55 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-emerald-500/15 dark:border-white/10 dark:bg-slate-900/42"
              >
                {chatter.cover && (
                  <div className="relative h-40 w-full overflow-hidden md:h-56">
                    <img src={chatter.cover} alt="cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>

                    {chatter.mood && (
                      <span className="absolute top-3 right-3 md:top-4 md:right-4 bg-white/20 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-sm border border-white/20 uppercase tracking-widest">
                        ✨ {chatter.mood}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-4 md:p-7">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="text-[8px] md:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider md:tracking-[0.2em] bg-indigo-500/5 dark:bg-indigo-400/10 px-1.5 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg border border-indigo-500/10">
                      {chatter.date}
                    </div>
                    {!chatter.cover && chatter.mood && (
                      <div className="text-[8px] md:text-[10px] font-black text-pink-600 dark:text-pink-400 bg-pink-500/5 dark:bg-pink-400/10 px-1.5 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg border border-pink-500/10">
                        {chatter.mood}
                      </div>
                    )}
                  </div>

                  {chatter.title && (
                    <h3 className="text-base md:text-2xl font-bold text-slate-800 dark:text-white mb-1.5 md:mb-4 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">{chatter.title}</h3>
                  )}

                  <div className="text-sm md:text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4 opacity-90 font-medium">
                    {chatter.content}
                  </div>

                  {chatter.tags && chatter.tags.length > 0 && (
                    <div className="mt-4 md:mt-6 flex flex-wrap gap-1.5 md:gap-2">
                      {chatter.tags.map(t => (
                        <span key={t} className="text-[8px] md:text-[9px] font-black text-slate-500 dark:text-slate-400 bg-slate-500/5 dark:bg-white/5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border border-slate-500/10 dark:border-white/5 transition-all group-hover:bg-indigo-500/10 group-hover:text-indigo-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
