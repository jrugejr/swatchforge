CREATE TABLE IF NOT EXISTS records (
  kind TEXT NOT NULL CHECK(kind IN ('items','recipes','shopping')),
  id TEXT NOT NULL,
  owner TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (kind,id)
);
CREATE INDEX IF NOT EXISTS idx_records_kind ON records(kind);
