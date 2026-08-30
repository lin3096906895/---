export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tags: string[];
  platform?: "github" | "gitee";
  coverImage?: string;
  coverPosition?: string;
};

export const projectsData: Project[] = [
  {
    id: "family-tree-2-baidu-maps",
    name: "族谱2-百度地图",
    githubUrl: "https://gitee.com/lin-youneng/family-tree-2---baidu-maps",
    description:
      "基于 Spring Boot 3 + Vue 3 的前后端分离族谱管理平台。用图模型建模真实族谱关系，内置家族图谱可视化、AI 智能助手、迁徙地图和统计看板。",
    icon: "🚀",
    tags: ["Java", "Spring Boot", "Vue"],
    platform: "gitee",
    coverImage: "/nahida/bg-1.jpg",
    coverPosition: "center 16%",
  },
  {
    id: "novel-platform",
    name: "Novel平台",
    githubUrl: "https://gitee.com/lin-youneng/novel-platform-initiative",
    description: "参考主流网文产品的通用业务能力，想打造属于自己的 AI 小说平台。",
    icon: "🚀",
    tags: ["React", "TypeScript", "Vite", "PostgreSQL", "NestJS"],
    platform: "gitee",
    coverImage: "/nahida/bg-3.jpg",
    coverPosition: "center 30%",
  },
];
