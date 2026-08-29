"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BackButton from "../../components/BackButton";
import { projectsData } from "../../data/projects";

function RepositoryIcon({ platform }: { platform?: "github" | "gitee" }) {
  if (platform === "gitee") {
    return (
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c71d23]/10 text-sm font-black text-[#c71d23] transition-colors group-hover:bg-[#c71d23] group-hover:text-white"
        title="Gitee"
        aria-label="Gitee"
      >
        G
      </span>
    );
  }

  return (
    <svg
      className="h-8 w-8 flex-shrink-0 text-slate-400 transition-colors group-hover:text-slate-800 dark:group-hover:text-white"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-label="GitHub"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"
      />
    </svg>
  );
}

export default function ProjectsBoard() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    if (searchQuery.trim() === "") return projectsData;
    const query = searchQuery.trim().toLowerCase();
    return projectsData.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-10">
      <div className="mb-8 flex flex-col items-center md:items-start">
        <div className="mb-6 flex w-full justify-start">
          <BackButton />
        </div>
        <div className="w-full text-center md:text-left">
          <h1 className="mb-4 text-4xl font-black tracking-widest text-slate-900 drop-shadow-sm uppercase dark:text-white">
            Projects Matrix
          </h1>
          <p className="font-serif text-slate-600 dark:text-slate-400">
            开源项目、科研代码与实验室折腾记录。
          </p>
        </div>
      </div>

      <div className="mb-12 flex w-full justify-center">
        <div className="relative w-full max-w-lg">
          <input
            type="text"
            placeholder="搜索项目名称、描述或技术栈..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-white/40 bg-white/40 py-3 pl-12 pr-6 font-serif text-slate-800 shadow-xl backdrop-blur-md transition-all placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-white"
          />
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AnimatePresence>
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -18 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="h-full"
            >
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block h-full overflow-hidden rounded-[28px] border border-white/40 bg-white/60 shadow-xl backdrop-blur-xl transition-all duration-700 hover:-translate-y-1 hover:shadow-emerald-500/20 dark:border-white/10 dark:bg-slate-900/50"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30 transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${project.coverImage || "/nahida/bg-1.jpg"})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/55 to-emerald-200/40 dark:from-slate-950/60 dark:via-slate-900/65 dark:to-emerald-950/50" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(74,222,128,0.18),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.08),transparent_35%)]" />

                <div className="relative z-10 flex min-h-[360px] flex-col p-6 md:p-8">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl drop-shadow-sm">{project.icon}</span>
                      <h2 className="text-2xl font-bold text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                        {project.name}
                      </h2>
                    </div>
                    <RepositoryIcon platform={project.platform} />
                  </div>

                  <p className="mb-6 min-h-[72px] line-clamp-3 text-sm leading-relaxed text-slate-700 font-serif dark:text-slate-200">
                    {project.description}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-emerald-500/20 bg-white/55 px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-700 shadow-sm uppercase backdrop-blur-sm dark:bg-white/10 dark:text-emerald-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full w-full py-20 text-center font-serif text-slate-500"
          >
            云端尚未建立代码为 [{searchQuery}] 的档案...
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
