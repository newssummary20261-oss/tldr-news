export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json([
      { id: 'general', label: 'Top Stories' },
      { id: 'technology', label: 'Tech' },
      { id: 'science', label: 'Science' },
    ]);
  }