CREATE TABLE IF NOT EXISTS records (
  kind TEXT NOT NULL CHECK(kind IN ('items','recipes','shopping')),
  id TEXT NOT NULL,
  owner TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (kind,id)
);
CREATE INDEX IF NOT EXISTS idx_records_kind ON records(kind);

CREATE TABLE IF NOT EXISTS login_attempts (
  identity TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL
);

-- Passwords are stored as salted PBKDF2 hashes, never plaintext.
-- The Worker also creates this table automatically on first authenticated use.
CREATE TABLE IF NOT EXISTS studio_accounts (
  profile TEXT PRIMARY KEY CHECK(profile IN ('Bloo','Phoenixx')),
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  session_version TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
