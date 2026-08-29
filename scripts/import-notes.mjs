import fs from "fs";
import path from "path";
import process from "process";
import matter from "gray-matter";
import iconv from "iconv-lite";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const notesRoot = process.argv[2] ? path.resolve(process.argv[2]) : "F:\\个人博客2\\笔记";
const connectionString = process.env.NOTES_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing NOTES_DATABASE_URL or DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString });

function readFileWithFallback(filePath) {
  const buffer = fs.readFileSync(filePath);
  const encodings = ["utf8", "gb18030", "utf16le"];

  for (const encoding of encodings) {
    try {
      const text = iconv.decode(buffer, encoding);
      if (text.includes("#") || text.includes("```") || text.includes("：") || text.includes(":")) {
        return text;
      }
    } catch {}
  }

  return iconv.decode(buffer, "gb18030");
}

function buildSlug(relativePath) {
  return relativePath
    .replace(/\\/g, "/")
    .replace(/\.(md|markdown)$/i, "")
    .replace(/[^\w\u4e00-\u9fa5/-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getExcerpt(content) {
  const stripped = content
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/^#+\s.*$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.slice(0, 180);
}

async function main() {
  const files = [];
  const stack = [notesRoot];

  while (stack.length) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) continue;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (/\.(md|markdown)$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  if (files.length === 0) {
    console.log(`No markdown files found under ${notesRoot}`);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const filePath of files) {
      const raw = readFileWithFallback(filePath);
      const parsed = matter(raw);
      const titleFromHeading = raw.match(/^#\s+(.+)$/m)?.[1]?.trim();
      const title = parsed.data.title || titleFromHeading || path.basename(filePath, path.extname(filePath));
      const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags.filter(Boolean) : [];
      const category =
        parsed.data.category ||
        path
          .relative(notesRoot, path.dirname(filePath))
          .split(path.sep)
          .filter(Boolean)
          .at(-1) ||
        "未分类";
      const publishedAt = parsed.data.date || fs.statSync(filePath).mtime.toISOString();
      const slug = buildSlug(path.relative(notesRoot, filePath));
      const excerpt = parsed.data.description || getExcerpt(parsed.content);

      await client.query(
        `
        INSERT INTO notes_archive (slug, title, excerpt, content, tags, source_path, category, published_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          content = EXCLUDED.content,
          tags = EXCLUDED.tags,
          source_path = EXCLUDED.source_path,
          category = EXCLUDED.category,
          published_at = EXCLUDED.published_at,
          updated_at = NOW()
        `,
        [slug, title, excerpt, parsed.content || raw, tags, filePath, category, publishedAt]
      );
    }
    await client.query("COMMIT");
    console.log(`Imported ${files.length} markdown files from ${notesRoot}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
