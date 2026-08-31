"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Send } from 'lucide-react';
import NahidaLive2D from './NahidaLive2D';

type ConversationMessage = {
  role: 'user' | 'model';
  content: string;
};

const PAGE_NAMES: Record<string, string> = {
  '/': '博客首页',
  '/projects': '项目页面',
  '/archive': '归档页面',
  '/notes': '笔记页面',
  '/photowall': '照片墙页面',
  '/music': '音乐页面',
  '/tree': '灵境页面',
  '/chatter': '杂谈页面',
  '/moments': '说说页面',
  '/friends': '友链页面',
  '/about': '关于页面',
};

export default function CyberCat() {
  const [isPetted, setIsPetted] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [live2dFailed, setLive2dFailed] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>(() => {
    if (typeof window === 'undefined') return [];

    try {
      const saved = JSON.parse(window.localStorage.getItem('nahida-conversation') || '[]');
      return Array.isArray(saved)
        ? saved
          .filter((item): item is ConversationMessage => {
            return item?.role === 'user' || item?.role === 'model';
          })
          .filter((item) => typeof item.content === 'string' && item.content.trim())
          .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 1200) }))
          .slice(-10)
        : [];
    } catch {
      return [];
    }
  });
  const dragControls = useDragControls();

  const chatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLive2dError = useCallback(() => {
    setLive2dFailed(true);
  }, []);

  const speak = (text: string, duration = 6000) => {
    setSpeech(text);
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
    chatTimeoutRef.current = setTimeout(() => {
      setSpeech(null);
    }, duration);
  };


  const handlePetCat = () => {
    if (isPetted) return;
    setIsPetted(true);
    speak("你是在和我打招呼吗？我听见了。", 3000);
    setTimeout(() => {
      setIsPetted(false);
    }, 2000);
  };

  const getPageContext = () => {
    const pathname = window.location.pathname;
    const pageName = PAGE_NAMES[pathname]
      || (pathname.startsWith('/notes/') ? '笔记详情页面' : null)
      || (pathname.startsWith('/chatter/') ? '杂谈详情页面' : null)
      || (pathname.startsWith('/posts/') ? '文章详情页面' : null)
      || '博客页面';

    const excerpt = document.querySelector('main')?.textContent
      ?.replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1600) || '';

    return { pathname, pageName, title: document.title, excerpt };
  };

  const askAssistant = async (message: string, thinkingText: string) => {
    if (isThinking) return;

    setIsThinking(true);
    setConversation((current) => [
      ...current,
      { role: 'user', content: message },
    ].slice(-10));
    speak(thinkingText, 12000);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: conversation,
          context: getPageContext(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI 服务暂时不可用');

      const reply = typeof data.reply === 'string' && data.reply.trim()
        ? data.reply.trim()
        : '知识树暂时没有传来清晰的回声，请稍后再试。';

      setConversation((current) => [
        ...current,
        { role: 'model', content: reply },
      ].slice(-10));
      speak(reply, 20000);
    } catch (error) {
      const fallback = error instanceof Error && error.message.includes('尚未配置')
        ? '我的思维之树还没有接入 AI 服务。配置 POKE_API_KEY 后，我就能真正理解你的问题了。'
        : error instanceof Error && error.message.includes('无法连接 Poke API')
          ? '我已经准备好了，但当前网络还连接不到 Poke API。请检查网络出口或配置 HTTPS_PROXY。'
        : '刚才的思绪没有连上知识树，请稍后再试一次。';
      setConversation((current) => [
        ...current,
        { role: 'model', content: fallback },
      ].slice(-10));
      speak(fallback, 6000);
    } finally {
      setIsThinking(false);
    }
  };

  const handleInspiration = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowChat(false);
    const { pageName } = getPageContext();
    await askAssistant(
      `请结合我正在浏览的“${pageName}”，给我一个简短但具体的思考方向、学习建议或改进灵感。不要泛泛地说“继续努力”，直接给出一条有用的建议。`,
      '让我从知识树上找一片适合此刻的叶片……',
    );
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setShowChat(false);
    await askAssistant(userMessage, '让我听清你的问题，再认真想一想……');
  };

  useEffect(() => {
    window.localStorage.setItem('nahida-conversation', JSON.stringify(conversation.slice(-10)));
  }, [conversation]);

  useEffect(() => {
    const quietThoughts = [
      '风吹过知识树时，总会带来一些新的想法。',
      '今天也可以给自己留一点时间，整理正在学习的东西。',
      '一个小问题认真追下去，常常会通向更大的理解。',
      '如果你正在犹豫，不妨先把最小的一步写下来。',
      '我会把这里的每一片叶子都记得清清楚楚。',
    ];
    const randomTalkInterval = setInterval(() => {
      if (!speech && !showChat && !isThinking && Math.random() > 0.8) {
        const randomMsg = quietThoughts[Math.floor(Math.random() * quietThoughts.length)];
        speak(randomMsg, 4000);
      }
    }, 20000);

    return () => clearInterval(randomTalkInterval);
  }, [speech, showChat, isThinking]);

  const live2dMood = isThinking ? 'thinking' : isPetted ? 'happy' : speech ? 'speaking' : 'idle';

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      whileDrag={{ scale: 1.1, cursor: "grabbing" }}
      className="fixed bottom-16 right-3 z-[9999] flex flex-col items-center group cursor-grab active:cursor-grabbing md:bottom-20 md:right-10 lg:right-20"
    >
      {/* 💬 聊天气泡 */}
      <div className="relative w-full flex justify-center mb-6">
        <AnimatePresence>
          {speech && !showChat && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="absolute bottom-0 max-h-[220px] w-[min(23rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-emerald-200/80 bg-emerald-50/95 px-4 py-3 text-left text-sm leading-relaxed text-emerald-950 shadow-xl dark:border-emerald-800/80 dark:bg-emerald-950/95 dark:text-emerald-50"
              style={{ pointerEvents: 'auto', transformOrigin: 'bottom center' }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              {speech}
              <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-50 dark:bg-emerald-950 border-b border-r border-emerald-200 dark:border-emerald-800 transform rotate-45"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 纳西妲互动区 */}
      <div className="relative">

        {/* 🌟 核心修改区：去掉了 opacity-0 和 group-hover，让按钮常驻显示 */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">

            {/* 💬 聊天按钮 */}
            <button
              onClick={(e) => {
                 e.stopPropagation();
                 setShowChat((current) => !current);
              }}
              // 稍微加了一点半透明背景，让常驻按钮在深色背景下也好看
              className="bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-emerald-200/70 dark:border-emerald-900/60 text-emerald-600 hover:text-emerald-700 flex items-center justify-center backdrop-blur-sm"
              title="聊天"
              aria-label="聊天"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
              </svg>
            </button>

            {/* 获取灵感按钮 */}
            <button
              onClick={handleInspiration}
              disabled={isThinking}
              className={`bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 flex items-center justify-center backdrop-blur-sm ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="获取灵感"
              aria-label="获取灵感"
            >
              <span className="text-xl leading-none text-emerald-600">✦</span>
            </button>
        </div>

        {/* Live2D 模型容器 */}
        <div
          className="w-[176px] h-[232px] md:w-[200px] md:h-[264px] relative cursor-pointer"
          onPointerDown={(event) => {
            if (event.button === 0) dragControls.start(event);
          }}
          onClick={handlePetCat}
        >
          <div className="h-full w-full">
            {!live2dFailed ? (
              <NahidaLive2D
                onError={handleLive2dError}
                mood={live2dMood}
                speaking={Boolean(speech) && !isThinking}
              />
            ) : (
              <>
                <style>{`
                .cat-sprite {
                  width: 100%;
                  height: 100%;
                  background-image: url('/siamese-cat.png');
                  background-size: 300% 300%;
                  background-repeat: no-repeat;
                  image-rendering: pixelated;
                }
                .cat-idle { animation: idle-frames 1.2s infinite; background-position-y: 0%; }
                .cat-petted { animation: pet-frames 0.8s infinite; background-position-y: 50%; }
                .cat-thinking { animation: idle-frames 0.6s infinite; background-position-y: 0%; }
                @keyframes idle-frames {
                  0%, 33.32% { background-position-x: 0%; }
                  33.33%, 66.65% { background-position-x: 50%; }
                  66.66%, 100% { background-position-x: 100%; }
                }
                @keyframes pet-frames {
                  0%, 49.99% { background-position-x: 0%; }
                  50%, 100% { background-position-x: 50%; }
                }
                `}</style>
                <div className={`cat-sprite drop-shadow-2xl ${isPetted ? 'cat-petted' : isThinking ? 'cat-thinking' : 'cat-idle'}`} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ⌨️ 轻量聊天输入框 */}
      <AnimatePresence>
        {showChat && (
          <motion.form
            initial={{ opacity: 0, y: -10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.92 }}
            onSubmit={handleChatSubmit}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            className="absolute -bottom-14 right-0 z-30 flex w-[min(20rem,calc(100vw-1.5rem))] items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/95 p-1.5 shadow-xl backdrop-blur-md dark:border-emerald-800/80 dark:bg-emerald-950/95"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="和纳西妲聊聊..."
              className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm text-emerald-950 outline-none placeholder-emerald-700/60 dark:text-emerald-50 dark:placeholder-emerald-300/60"
              disabled={isThinking}
              autoFocus
            />
            <button
              type="submit"
              disabled={isThinking || !inputValue.trim()}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                isThinking || !inputValue.trim() ? 'bg-emerald-200 text-emerald-500 dark:bg-emerald-900 dark:text-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
              title="发送消息"
              aria-label="发送消息"
            >
              <Send className="h-4 w-4" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
