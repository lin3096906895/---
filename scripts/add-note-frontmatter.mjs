import fs from "fs";
import iconv from "iconv-lite";

const files = [
  {
    path: "F:/个人博客2/笔记/树状数组.md",
    meta: {
      title: "树状数组",
      date: "2026-08-29",
      tags: ["算法", "数据结构", "竞赛"],
      category: "数据结构",
    },
  },
  {
    path: "F:/个人博客2/笔记/质因数分解定理.md",
    meta: {
      title: "质因数分解定理",
      date: "2026-08-29",
      tags: ["数学", "数论", "竞赛"],
      category: "数学",
    },
  },
  {
    path: "F:/个人博客2/笔记/高精度除法.md",
    meta: {
      title: "高精度除法",
      date: "2026-08-29",
      tags: ["算法", "高精度", "竞赛"],
      category: "大数运算",
    },
  },
];

function decodeBuffer(buffer) {
  const candidates = ["utf8", "gb18030", "utf16le"];
  for (const encoding of candidates) {
    try {
      const text = iconv.decode(buffer, encoding);
      if (text.includes("#")) return text;
    } catch {}
  }
  return iconv.decode(buffer, "gb18030");
}

for (const item of files) {
  const buffer = fs.readFileSync(item.path);
  const text = decodeBuffer(buffer);
  if (text.startsWith("---\n")) continue;

  const frontmatter =
    "---\n" +
    `title: ${item.meta.title}\n` +
    `date: ${item.meta.date}\n` +
    `tags: [${item.meta.tags.join(", ")}]\n` +
    `category: ${item.meta.category}\n` +
    "---\n\n";

  fs.writeFileSync(item.path, frontmatter + text, "utf8");
}

console.log("Frontmatter added to 3 notes.");
