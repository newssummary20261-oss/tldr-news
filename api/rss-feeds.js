const RSS_SOURCES = {
    general: [
      { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml' },
      { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' },
      { name: 'ABC News', url: 'https://abcnews.go.com/abcnews/topstories' },
    ],
    technology: [
      { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    ],
    business: [
      { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml' },
      { name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147' },
    ],
    science: [
      { name: 'BBC Science', url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
      { name: 'Space.com', url: 'https://www.space.com/feeds/all' },
      { name: 'Live Science', url: 'https://www.livescience.com/feeds/all' },
    ],
    health: [
      { name: 'BBC Health', url: 'http://feeds.bbci.co.uk/news/health/rss.xml' },
      { name: 'Medical News Today', url: 'https://www.medicalnewstoday.com/rss' },
    ],
    sports: [
      { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
      { name: 'BBC Sport', url: 'http://feeds.bbci.co.uk/sport/rss.xml' },
    ],
    entertainment: [
      { name: 'BBC Entertainment', url: 'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
      { name: 'Variety', url: 'https://variety.com/feed/' },
    ],
    world: [
      { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
      { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    ],
    politics: [
      { name: 'BBC Politics', url: 'http://feeds.bbci.co.uk/news/politics/rss.xml' },
      { name: 'Politico', url: 'https://www.politico.com/rss/politicopicks.xml' },
    ],
    environment: [
      { name: 'BBC Environment', url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
      { name: 'Guardian Environment', url: 'https://www.theguardian.com/environment/rss' },
    ],
  };
  
  function cleanText(text) {
    if (!text) return '';
    return text
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  function parseItem(xml, source) {
    const title = xml.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const link = xml.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
    const desc = xml.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
    const date = xml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/s);
    
    return {
      title: title ? cleanText(title[1]) : null,
      url: link ? cleanText(link[1]) : null,
      content: desc ? cleanText(desc[1]) : null,
      publishedAt: date ? new Date(date[1]).toISOString() : new Date().toISOString(),
      source: { name: source }
    };
  }
  
  async function fetchFeed(url, name) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'TLDR-Bot/1.0' } });
      if (!res.ok) return [];
      
      const xml = await res.text();
      const items = [];
      const regex = /<item[^>]*>(.*?)<\/item>/gs;
      let match;
      
      while ((match = regex.exec(xml)) !== null) {
        const article = parseItem(match[1], name);
        if (article.title && article.url && article.content?.length > 50) {
          items.push(article);
        }
      }
      return items.slice(0, 3);
    } catch (e) {
      console.log(`   ⚠️ ${name}: ${e.message}`);
      return [];
    }
  }
  
  export async function fetchNews(category = 'general') {
    const sources = RSS_SOURCES[category] || RSS_SOURCES.general;
    const articles = [];
    
    for (const src of sources) {
      const items = await fetchFeed(src.url, src.name);
      articles.push(...items);
      await new Promise(r => setTimeout(r, 300));
    }
    
    return articles;
  }