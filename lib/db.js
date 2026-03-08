import { neon } from "@neondatabase/serverless";

function getSQL() {
  return neon(process.env.POSTGRES_URL);
}

let initialized = false;

async function ensureTables() {
  if (initialized) return;
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS poll_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      question TEXT NOT NULL DEFAULT 'Which beer would you pick?',
      beers JSONB NOT NULL DEFAULT '[]'::jsonb,
      num_per_vote INTEGER NOT NULL DEFAULT 3,
      is_live BOOLEAN NOT NULL DEFAULT false,
      pin TEXT NOT NULL DEFAULT ''
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      picked TEXT NOT NULL,
      shown JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    INSERT INTO poll_config (id, question, beers, num_per_vote, is_live, pin)
    VALUES (1, 'Which beer would you pick?', '[]'::jsonb, 3, false, '')
    ON CONFLICT (id) DO NOTHING
  `;
  initialized = true;
}

export async function getConfig() {
  await ensureTables();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM poll_config WHERE id = 1`;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    question: row.question,
    beers: row.beers,
    numPerVote: row.num_per_vote,
    isLive: row.is_live,
    pin: row.pin,
  };
}

export async function updateConfig(config) {
  await ensureTables();
  const sql = getSQL();
  const beersJson = JSON.stringify(config.beers);
  await sql`
    UPDATE poll_config SET
      question = ${config.question},
      beers = ${beersJson}::jsonb,
      num_per_vote = ${config.numPerVote},
      is_live = ${config.isLive},
      pin = ${config.pin}
    WHERE id = 1
  `;
}

export async function addVote(picked, shown) {
  await ensureTables();
  const sql = getSQL();
  const shownJson = JSON.stringify(shown);
  await sql`
    INSERT INTO votes (picked, shown)
    VALUES (${picked}, ${shownJson}::jsonb)
  `;
}

export async function getVotes() {
  await ensureTables();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM votes ORDER BY created_at ASC`;
  return rows.map((r) => ({
    picked: r.picked,
    shown: r.shown,
    ts: r.created_at.toISOString(),
  }));
}

export async function clearAllVotes() {
  await ensureTables();
  const sql = getSQL();
  await sql`DELETE FROM votes`;
}
