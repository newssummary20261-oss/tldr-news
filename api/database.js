import { createClient } from '@libsql/client';

let db;

export function getDb() {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

export async function initDatabase() {
  const client = getDb();
  await client.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_url TEXT UNIQUE NOT NULL,
      original_headline TEXT NOT NULL,
      source_name TEXT NOT NULL,
      tldr_headline TEXT NOT NULL,
      tldr_summary TEXT NOT NULL,
      category TEXT NOT NULL,
      published_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_cat ON articles(category)`);
  console.log('✅ Database ready');
}

export async function getArticles(category, limit = 20) {
  const result = await getDb().execute({
    sql: `SELECT id, tldr_headline as headline, tldr_summary as summary,
          source_name as source, original_url as sourceUrl,
          published_at as publishedAt, category
          FROM articles WHERE category = ? 
          ORDER BY published_at DESC LIMIT ?`,
    args: [category, limit]
  });
  return result.rows;
}

export async function articleExists(url) {
  const result = await getDb().execute({
    sql: 'SELECT id FROM articles WHERE original_url = ?',
    args: [url]
  });
  return result.rows.length > 0;
}

export async function saveArticle(article) {
  await getDb().execute({
    sql: `INSERT OR IGNORE INTO articles 
          (original_url, original_headline, source_name, tldr_headline, 
           tldr_summary, category, published_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      article.originalUrl, article.originalHeadline, article.sourceName,
      article.tldrHeadline, article.tldrSummary, article.category,
      article.publishedAt
    ]
  });
}