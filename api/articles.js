import { createClient } from '@libsql/client';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    
    const category = req.query.category || 'general';
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await db.execute({
      sql: `SELECT id, tldr_headline as headline, tldr_summary as summary,
            source_name as source, original_url as sourceUrl,
            published_at as publishedAt, category
            FROM articles WHERE category = ? 
            ORDER BY published_at DESC LIMIT ?`,
      args: [category, limit]
    });
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch' });
  }
}