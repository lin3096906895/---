import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';
import TimelineClient from '../../components/TimelineClient';
// 🌟 1. 引入 ToastProvider 喵！
import { ToastProvider } from '../../components/ToastProvider';

export const metadata = {
  title: "归档与探索 | " + siteConfig.title,
};

function normalizeDate(value: unknown) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "1970-01-01";
    return value.toISOString().replace("T", " ").slice(0, 19);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "1970-01-01";
    if (trimmed.includes("T")) return trimmed.replace("T", " ").slice(0, 19);
    return trimmed;
  }

  return "1970-01-01";
}

function loadPostsFromDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) return [];

  return fs
    .readdirSync(dirPath)
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(dirPath, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);
      const postTags = data.tags && Array.isArray(data.tags) ? data.tags : ['未分类'];

      return {
        slug,
        title: data.title || '无标题',
        date: normalizeDate(data.date || '1970-01-01'),
        description: data.description || '',
        tags: postTags,
        cover: data.cover || siteConfig.defaultPostCover,
        source: fullPath,
      };
    });
}

export default function Timeline() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const archiveDirectory = path.resolve(process.cwd(), '..', '..', '归档');
  let posts: any[] = [];
  let tagCounts: Record<string, number> = {};

  try {
    posts = [
      ...loadPostsFromDir(postsDirectory),
      ...loadPostsFromDir(archiveDirectory),
    ];

    posts.forEach((post) => {
      post.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    posts.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.slug.localeCompare(a.slug);
    });
  } catch(e) {
    console.error("读取文章列表失败", e);
  }

  const tagsArray = Object.keys(tagCounts)
    .map(name => ({ name, count: tagCounts[name] }))
    .sort((a, b) => b.count - a.count);

  return (
    // 🌟 2. 在最外层用 ToastProvider 包裹整个页面
    <ToastProvider>
      <div className="min-h-screen relative pb-32">
        <Navbar />
        <PageTransition>
          <TimelineClient posts={posts} tags={tagsArray} />
        </PageTransition>
      </div>
    </ToastProvider>
  );
}
