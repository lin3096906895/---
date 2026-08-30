"use client";

import { useEffect, useState } from 'react';
import { siteConfig } from '../siteConfig';

export default function SiteDashboard() {
  const [timeStr, setTimeStr] = useState('');
  const [uptimeStr, setUptimeStr] = useState('');

  const START_DATE = new Date(siteConfig.buildDate || '2026-08-29T00:00:00').getTime();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));

      const diff = now.getTime() - START_DATE;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      setUptimeStr(`${days}天 ${hours}小时`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [START_DATE]);

  return (
    <div className="md:col-span-12 rounded-3xl bg-white/45 dark:bg-slate-800/45 backdrop-blur-md border border-white/35 dark:border-white/10 shadow-xl overflow-hidden flex flex-col md:flex-row items-stretch transition-colors duration-700 h-auto md:h-20 group">
      <div className="bg-emerald-950/95 dark:bg-emerald-950 text-white px-8 py-4 md:py-0 flex items-center justify-center font-mono text-2xl md:text-3xl font-black tracking-widest shadow-inner relative overflow-hidden group-hover:text-emerald-200 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        {timeStr || '00:00:00'}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-black/50" />
      </div>

      <div className="flex-1 px-6 py-4 md:py-0 flex flex-wrap items-center justify-between gap-4 text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>
            系统已稳定运行：<span className="text-indigo-600 dark:text-indigo-400 font-black">{uptimeStr}</span>
          </span>
        </div>

        <div className="flex gap-2">
          {siteConfig.footerBadges?.map((badge, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-white/50 dark:bg-slate-700/50 rounded-md shadow-sm flex items-center gap-1 border border-white/40 dark:border-slate-600"
            >
              <svg className={`w-3.5 h-3.5 ${badge.color}`} fill="currentColor" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: badge.svg }} />
              {badge.name}
            </span>
          ))}
        </div>

        {siteConfig.icpConfig && (
          <a
            href={siteConfig.icpConfig.link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-500 transition-colors border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5"
          >
            {siteConfig.icpConfig.name}
          </a>
        )}
      </div>
    </div>
  );
}
