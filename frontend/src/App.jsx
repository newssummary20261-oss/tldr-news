import { useState, useEffect } from 'react';
import './App.css';

const API = import.meta.env.VITE_API_URL || '';

const CATEGORIES = [
  { id: 'general', label: 'Top Stories', icon: '📰' },
  { id: 'technology', label: 'Tech', icon: '💻' },
  { id: 'business', label: 'Business', icon: '📈' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'world', label: 'World', icon: '🌍' },
  { id: 'politics', label: 'Politics', icon: '🏛️' },
  { id: 'environment', label: 'Environment', icon: '🌱' },
];

function timeAgo(date) {
  const hours = Math.floor((new Date() - new Date(date)) / 3600000);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Card({ article }) {
  return (
    <article className="card">
      <div className="card-top">
        <span className="source">{article.source}</span>
        <span className="time">{timeAgo(article.publishedAt)}</span>
      </div>
      <h2>{article.headline}</h2>
      <p>{article.summary}</p>
      <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
        Read at {article.source} →
      </a>
    </article>
  );
}

export default function App() {
  const [category, setCategory] = useState('general');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/articles?category=${category}`)
      .then(r => r.json())
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="app">
      <header>
        <h1>⚡ TLDR News</h1>
        <p>AI summaries • Always linked • 100% Free</p>
      </header>

      <nav>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            className={category === c.id ? 'active' : ''}
            onClick={() => setCategory(c.id)}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </nav>

      <main>
        {loading ? (
          <p className="loading">Loading...</p>
        ) : articles.length > 0 ? (
          <div className="grid">
            {articles.map(a => <Card key={a.id} article={a} />)}
          </div>
        ) : (
          <p className="empty">No articles yet.</p>
        )}
      </main>

      <footer>
        <p>Powered by Gemini AI (Free Tier)</p>
      </footer>
    </div>
  );
}