import 'dotenv/config';
import { initDatabase, saveArticle, getArticles } from './database.js';

async function test() {
  console.log('Testing database...');
  
  await initDatabase();
  
  // Add a test article
  await saveArticle({
    originalUrl: 'https://example.com/test-' + Date.now(),
    originalHeadline: 'Original Test Headline',
    sourceName: 'Test Source',
    tldrHeadline: 'This Is A Test Article',
    tldrSummary: 'This is a test summary to check if the database and website are working correctly.',
    category: 'general',
    publishedAt: new Date().toISOString()
  });
  
  console.log('✅ Test article saved!');
  
  // Check if it's there
  const articles = await getArticles('general', 5);
  console.log('Articles in database:', articles.length);
  console.log(articles);
}

test().catch(console.error);