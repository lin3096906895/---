CREATE TABLE IF NOT EXISTS notes_archive (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source_path TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '未分类',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_archive_published_at ON notes_archive (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_archive_tags ON notes_archive USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_notes_archive_search ON notes_archive USING GIN (
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, ''))
);
