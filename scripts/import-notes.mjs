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
const publicAssetsRoot = path.join(projectRoot, "public", "notes-assets");
const watchMode = process.argv.includes("--watch");
const pruneMode = process.argv.includes("--prune");

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

function slugToFsPath(slug) {
  return slug.split("/").filter(Boolean).join(path.sep);
}

function toPublicAssetUrl(slug, fileName) {
  return ["/notes-assets", ...slug.split("/").filter(Boolean).map(encodeURIComponent), encodeURIComponent(fileName)].join("/");
}

function copyNoteAssets(noteFilePath, slug) {
  const noteDir = path.dirname(noteFilePath);
  const baseName = path.basename(noteFilePath, path.extname(noteFilePath));
  const sourceAssetDir = path.join(noteDir, `${baseName}.assets`);

  if (!fs.existsSync(sourceAssetDir) || !fs.statSync(sourceAssetDir).isDirectory()) {
    return false;
  }

  const targetAssetDir = path.join(publicAssetsRoot, slugToFsPath(slug));
  fs.mkdirSync(targetAssetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceAssetDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    fs.copyFileSync(path.join(sourceAssetDir, entry.name), path.join(targetAssetDir, entry.name));
  }

  return true;
}

function rewriteAssetLinks(content, slug) {
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, rawPath) => {
    const normalizedPath = String(rawPath).replace(/\\/g, "/");
    if (!normalizedPath.includes(".assets/")) return match;

    const fileName = normalizedPath.split("/").pop();
    if (!fileName) return match;

    return `![${alt}](${toPublicAssetUrl(slug, fileName)})`;
  });
}

async function importNotesOnce() {
  const files = [];
  const stack = [notesRoot];
  const seenSlugs = new Set();

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
      seenSlugs.add(slug);
      const assetCopied = copyNoteAssets(filePath, slug);
      const content = assetCopied ? rewriteAssetLinks(parsed.content || raw, slug) : (parsed.content || raw);
      const excerpt = parsed.data.description || getExcerpt(content);

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
        [slug, title, excerpt, content, tags, filePath, category, publishedAt]
      );
    }

    if (pruneMode) {
      const { rows } = await client.query("SELECT slug FROM notes_archive");
      for (const row of rows) {
        if (seenSlugs.has(row.slug)) continue;
        await client.query("DELETE FROM notes_archive WHERE slug = $1", [row.slug]);
        const assetDir = path.join(publicAssetsRoot, slugToFsPath(row.slug));
        fs.rmSync(assetDir, { recursive: true, force: true });
      }
    }

    await client.query("COMMIT");
    console.log(`Imported ${files.length} markdown files from ${notesRoot}`);
    if (pruneMode) {
      console.log("Prune mode: removed notes missing from local folder.");
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function runOnceAndClose() {
  try {
    await importNotesOnce();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function runWatch() {
  let running = false;
  let rerun = false;
  let timer = null;

  const queueRun = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      if (running) {
        rerun = true;
        return;
      }

      running = true;
      do {
        rerun = false;
        try {
          await importNotesOnce();
        } catch (error) {
          console.error(error);
        }
      } while (rerun);
      running = false;
    }, 300);
  };

  try {
    await importNotesOnce();
    console.log(`Watching ${notesRoot} for markdown changes...`);
    fs.watch(notesRoot, { recursive: true }, queueRun);
    process.stdin.resume();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

if (watchMode) {
  runWatch();
} else {
  runOnceAndClose();
}
