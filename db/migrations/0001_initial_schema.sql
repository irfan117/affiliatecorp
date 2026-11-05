-- Migration 0001: Skema Data Minimum D1 (Sesuai Bagian 8 ars.md)
-- Jangan mengirim seluruh katalog ke AI; Worker mengambil kandidat teratas terlebih dahulu.

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_product_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  problem_tags TEXT NOT NULL,       -- JSON array masalah & sinonim
  solution_summary TEXT NOT NULL,
  tradeoffs TEXT,                   -- Catatan trade-off jujur & hal yang perlu diperiksa
  price_min INTEGER,
  price_max INTEGER,
  currency TEXT DEFAULT 'IDR',
  rating REAL,
  sales_count INTEGER,
  image_url TEXT,
  destination_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  source_updated_at TEXT,
  published_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  quality_score REAL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS query_events (
  id TEXT PRIMARY KEY,
  session_hash TEXT,
  query_hash TEXT NOT NULL,
  topic TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS click_events (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  session_hash TEXT,
  referrer TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status, category);
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at);
CREATE INDEX IF NOT EXISTS idx_query_events_topic_created ON query_events(topic, created_at);
CREATE INDEX IF NOT EXISTS idx_click_events_product_created ON click_events(product_id, created_at);

