import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import MomentList from './MomentList';
import { siteConfig } from '../../siteConfig';

export const metadata = {
  title: "说说 | " + siteConfig.title,
  description: "生活动态与瞬间记录",
};

export const dynamic = "force-dynamic";

function findMarkdownFiles(directory: string, baseDirectory = directory): string[] {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findMarkdownFiles(fullPath, baseDirectory);
    return /\.(md|markdown)$/i.test(entry.name) ? [path.relative(baseDirectory, fullPath)] : [];
  });
}

export default function MomentsPage() {
  let allMoments: any[] = [];

  try {
    const possibleDirs = [
      path.join(process.cwd(), 'posts', 'moments'),
      path.join(process.cwd(), 'moments')
    ];

    possibleDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const fileNames = findMarkdownFiles(dir);
        fileNames.forEach(fileName => {
          const fullPath = path.join(dir, fileName);
          const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));

          allMoments.push({
            id: data.id || fileName.replace(/\.(md|markdown)$/i, '').replace(/\\/g, '/'),
            date: data.date || '1970-01-01',
            location: data.location || '',
            images: data.images || [],
            content: content.trim()
          });
        });
      }
    });

    allMoments = Array.from(new Map(allMoments.map(item => [item.id, item])).values());

  } catch (e) {
    console.error("读取说说数据失败:", e);
  }

  return (
    <div className="min-h-screen relative pb-10 flex flex-col">
      <Navbar />
      <PageTransition className="flex-1 flex flex-col">
        <MomentList
          moments={allMoments}
          authorName={siteConfig.authorName}
          avatarUrl={siteConfig.avatarUrl}
        />
      </PageTransition>
    </div>
  );
}
