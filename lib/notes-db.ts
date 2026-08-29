import { Pool } from "pg";

const localConnection = "postgres://xhblogs:xhblogs123@localhost:5433/xhblogs_notes";
const connectionString =
  process.env.NODE_ENV === "production"
    ? process.env.NOTES_DATABASE_URL || process.env.DATABASE_URL || localConnection
    : localConnection;

declare global {
  var __notesDbPool: Pool | undefined;
}

export const notesDbPool =
  global.__notesDbPool ||
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  global.__notesDbPool = notesDbPool;
}

export type NoteArchiveRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  source_path: string;
  category: string;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type NoteArchiveListItem = Pick<
  NoteArchiveRow,
  "id" | "slug" | "title" | "excerpt" | "tags" | "source_path" | "category" | "published_at"
>;

export async function listNotesArchive(params: {
  query?: string;
  tag?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);
  const values: Array<string | number> = [];
  const where: string[] = [];

  if (params.query?.trim()) {
    values.push(params.query.trim());
    where.push(
      `(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '') || ' ' || array_to_string(tags, ' ')) @@ websearch_to_tsquery('simple', $${values.length})
        OR $${values.length} = ANY(tags)
        OR title ILIKE '%' || $${values.length} || '%'
        OR excerpt ILIKE '%' || $${values.length} || '%'
        OR content ILIKE '%' || $${values.length} || '%'
        OR EXISTS (
          SELECT 1
          FROM unnest(tags) AS tag_name
          WHERE tag_name ILIKE '%' || $${values.length} || '%'
        ))`
    );
  }

  if (params.tag?.trim()) {
    values.push(params.tag.trim());
    where.push(`$${values.length} = ANY(tags)`);
  }

  values.push(limit);
  values.push(offset);

  const sql = `
    SELECT id, slug, title, excerpt, tags, source_path, category, published_at
    FROM notes_archive
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY published_at DESC, id DESC
    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `;

  const { rows } = await notesDbPool.query<NoteArchiveListItem>(sql, values);
  return rows;
}

export async function getNoteArchiveBySlug(slug: string) {
  const { rows } = await notesDbPool.query<NoteArchiveRow>(
    `
    SELECT id, slug, title, excerpt, content, tags, source_path, category, published_at, created_at, updated_at
    FROM notes_archive
    WHERE slug = $1
    LIMIT 1
    `,
    [slug]
  );

  return rows[0] ?? null;
}

export async function getNotesArchiveStats() {
  const [totalResult, tagResult] = await Promise.all([
    notesDbPool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM notes_archive"),
    notesDbPool.query<{ name: string; count: string }>(
      `
      SELECT unnest(tags) AS name, COUNT(*)::text AS count
      FROM notes_archive
      GROUP BY name
      ORDER BY COUNT(*) DESC, name ASC
      `
    ),
  ]);

  return {
    total: Number(totalResult.rows[0]?.count ?? 0),
    tags: tagResult.rows.map((row) => ({
      name: row.name,
      count: Number(row.count),
    })),
  };
}
