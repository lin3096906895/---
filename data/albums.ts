export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    id: "nahida-forest",
    title: "纳西妲森林纪行",
    description: "一组围绕草木、微光与静谧感的首页测试相册。",
    cover: "/nahida/bg-1.jpg",
    date: "2026.01",
    photos: [
      { url: "/nahida/bg-1.jpg", caption: "森林微光" },
      { url: "/nahida/bg-2.jpg", caption: "温柔注视" },
      { url: "/nahida/bg-3.jpg", caption: "花与风" },
    ],
  },
  {
    id: "nahida-dream",
    title: "草木之梦",
    description: "更适合做首页背景和照片墙的纳西妲图片集合。",
    cover: "/nahida/bg-2.jpg",
    date: "2025.10",
    photos: [
      { url: "/nahida/bg-2.jpg", caption: "梦中森林" },
      { url: "/nahida/bg-3.jpg", caption: "轻盈步伐" },
      { url: "/nahida/avatar.jpg", caption: "头像候选" },
    ],
  },
];