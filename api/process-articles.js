import 'dotenv/config';
import { initDatabase, articleExists, saveArticle } from './database.js';
import { fetchNews } from './rss-feeds.js';
import { generateSummary } from './summarizer.js';
import { checkAge, runChecks } from './similarity-checker.js';

// =============================================
// CONFIG - Optimized for Gemini FREE tier
// =============================================
const CONFIG = {
  // Gemini free tier: 15 requests/min, 1500/day
  // Stay well under limit
  maxArticlesPerRun: 100,
  
  categories: ['general','technology','business','science','health','sports','entertainment','world','politics','environment'],
  
  maxRetries: 2,
  
  // Delay between API calls (ms) to respect rate limits
  delayBetweenCalls: 5000, // 5 seconds = 12 requests/min max
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('');
  console.log('🚀 TLDR News Processor (FREE Gemini Edition)');
  console.log(`   Max articles: ${CONFIG.maxArticlesPerRun}`);
//   console.log(`   Using: Gemini 2.0 Flash Lite (FREE)`);
  console.log('   Using: Groq Llama 3.3 (FREE)');
  console.log('');
  
  await initDatabase();
  
  let totalProcessed = 0;
  let published = 0;
  let skipped = 0;
  
  for (const category of CONFIG.categories) {
    if (totalProcessed >= CONFIG.maxArticlesPerRun) {
      console.log(`\n⚠️ Reached limit of ${CONFIG.maxArticlesPerRun} articles`);
      break;
    }
    
    console.log(`\n📁 ${category}`);
    
    try {
      const articles = await fetchNews(category);
      console.log(`   Found ${articles.length} articles`);
      
      for (const article of articles) {
        if (totalProcessed >= CONFIG.maxArticlesPerRun) break;
        
        // Skip if exists
        if (await articleExists(article.url)) {
          skipped++;
          continue;
        }
        
        // Check age (48+ hours)
        const age = checkAge(article.publishedAt);
        if (!age.passed) {
          console.log(`   ⏳ Too new (${age.ageHours}h)`);
          skipped++;
          continue;
        }
        
        // Generate summary
        totalProcessed++;
        let success = false;
        let result = null;
        
        for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
          try {
            console.log(`   🤖 Generating summary (attempt ${attempt})...`);
            
            const { newHeadline, summary } = await generateSummary(
              article.title,
              article.content,
              article.source.name,
              attempt
            );
            
            const checks = await runChecks(article.content, summary);
            
            if (checks.passed) {
              result = { newHeadline, summary };
              success = true;
              break;
            }
            
            console.log(`   ⚠️ Too similar: ${checks.warnings.join(', ')}`);
            await sleep(CONFIG.delayBetweenCalls);
          } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            
            // If rate limited, wait longer
            if (e.message.includes('429') || e.message.includes('rate')) {
              console.log('   ⏳ Rate limited, waiting 60 seconds...');
              await sleep(60000);
            }
          }
        }
        
        if (success) {
          await saveArticle({
            originalUrl: article.url,
            originalHeadline: article.title,
            sourceName: article.source.name,
            tldrHeadline: result.newHeadline,
            tldrSummary: result.summary,
            category,
            publishedAt: article.publishedAt
          });
          console.log(`   ✅ ${result.newHeadline.substring(0, 45)}...`);
          published++;
        } else {
          skipped++;
        }
        
        // Wait between requests to stay under rate limit
        await sleep(CONFIG.delayBetweenCalls);
      }
    } catch (e) {
      console.error(`   Error: ${e.message}`);
    }
  }
  
  console.log('\n========================================');
  console.log('Done!');
  console.log(`   API calls: ${totalProcessed} (FREE!)`);
  console.log(`   Published: ${published}`);
  console.log(`   Skipped: ${skipped}`);
  console.log('========================================\n');
}

main().catch(console.error);