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

-- Shared circulation: one active loan per inventory record; history is retained.
-- Worker creates this table and indexes automatically on first state request.
CREATE TABLE IF NOT EXISTS studio_loans (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  owner TEXT NOT NULL,
  borrower TEXT NOT NULL,
  checked_out_at TEXT NOT NULL,
  due_date TEXT,
  checked_in_at TEXT,
  checked_in_by TEXT,
  return_requested_at TEXT,
  item_snapshot TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_studio_active_loans ON studio_loans(item_id) WHERE checked_in_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_studio_loan_history ON studio_loans(checked_out_at DESC);
