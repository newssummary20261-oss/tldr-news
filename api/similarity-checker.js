// =============================================
// SIMILARITY CHECKER
// Free: word matching + structure analysis
// Optional: OpenAI semantic check (toggle below)
// =============================================

// ⬇️ TOGGLE: Set to true to enable OpenAI check (~$1-3/mo)
const USE_SEMANTIC_CHECK = false;

const THRESHOLDS = {
  literal: 0.25,
  structure: 0.40,
  semantic: 0.70,
};

const MIN_AGE_HOURS = 48;

// Age check
export function checkAge(publishedAt) {
  const age = (Date.now() - new Date(publishedAt)) / 3600000;
  return {
    passed: age >= MIN_AGE_HOURS,
    ageHours: Math.round(age),
    required: MIN_AGE_HOURS
  };
}

// Word tokenizer
function tokenize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ')
    .split(/\s+/).filter(w => w.length > 2);
}

function getNgrams(text) {
  const words = tokenize(text);
  const ngrams = [];
  for (let i = 0; i <= words.length - 3; i++) {
    ngrams.push(words.slice(i, i + 3).join(' '));
  }
  return ngrams;
}

// Literal check
export function checkLiteral(original, summary) {
  const origSet = new Set(getNgrams(original));
  const summGrams = getNgrams(summary);
  
  if (summGrams.length === 0) return { passed: true, score: 0 };
  
  const matches = summGrams.filter(g => origSet.has(g));
  const score = matches.length / summGrams.length;
  
  return {
    passed: score <= THRESHOLDS.literal,
    score: Math.round(score * 100) / 100
  };
}

// Structure check
function wordType(w) {
  const word = w.toLowerCase();
  if (['the','a','an','this','that','these','those'].includes(word)) return 'D';
  if (['in','on','at','to','for','with','by','from'].includes(word)) return 'P';
  if (['and','but','or','if','when','because'].includes(word)) return 'C';
  if (['is','are','was','were','be','been','have','has','had'].includes(word)) return 'V';
  if (word.endsWith('ing') || word.endsWith('ed')) return 'V';
  if (word.endsWith('ly')) return 'A';
  return 'W';
}

function getPattern(sentence) {
  return sentence.replace(/[^\w\s]/g, '').split(/\s+/)
    .filter(w => w).map(wordType).join('');
}

export function checkStructure(original, summary) {
  const origSents = original.split(/[.!?]+/).filter(s => s.trim());
  const summSents = summary.split(/[.!?]+/).filter(s => s.trim());
  
  if (summSents.length === 0) return { passed: true, score: 0 };
  
  const origPatterns = origSents.map(getPattern);
  const summPatterns = summSents.map(getPattern);
  
  let matches = 0;
  for (const sp of summPatterns) {
    for (const op of origPatterns) {
      if (patternSimilarity(sp, op) > 0.75) {
        matches++;
        break;
      }
    }
  }
  
  const score = matches / summSents.length;
  return {
    passed: score <= THRESHOLDS.structure,
    score: Math.round(score * 100) / 100
  };
}

function patternSimilarity(p1, p2) {
  if (!p1.length || !p2.length) return 0;
  let matches = 0;
  const minLen = Math.min(p1.length, p2.length);
  for (let i = 0; i < minLen; i++) {
    if (p1[i] === p2[i]) matches++;
  }
  return (2 * matches) / (p1.length + p2.length);
}

// Semantic check (optional, costs money)
async function checkSemantic(original, summary) {
  if (!USE_SEMANTIC_CHECK) {
    return { passed: true, score: 0, skipped: true };
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('   ⚠️ OPENAI_API_KEY not set');
    return { passed: true, score: 0, skipped: true };
  }
  
  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const [e1, e2] = await Promise.all([
      openai.embeddings.create({ model: 'text-embedding-3-small', input: original }),
      openai.embeddings.create({ model: 'text-embedding-3-small', input: summary }),
    ]);
    
    const v1 = e1.data[0].embedding;
    const v2 = e2.data[0].embedding;
    
    let dot = 0, m1 = 0, m2 = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      m1 += v1[i] * v1[i];
      m2 += v2[i] * v2[i];
    }
    const score = dot / (Math.sqrt(m1) * Math.sqrt(m2));
    
    return {
      passed: score <= THRESHOLDS.semantic,
      score: Math.round(score * 100) / 100
    };
  } catch (e) {
    console.log(`   ⚠️ Semantic error: ${e.message}`);
    return { passed: true, score: 0, error: e.message };
  }
}

// Run all checks
export async function runChecks(original, summary) {
  const literal = checkLiteral(original, summary);
  const structure = checkStructure(original, summary);
  const semantic = await checkSemantic(original, summary);
  
  const passed = literal.passed && structure.passed && semantic.passed;
  const warnings = [];
  
  if (!literal.passed) warnings.push(`Literal: ${literal.score * 100}%`);
  if (!structure.passed) warnings.push(`Structure: ${structure.score * 100}%`);
  if (!semantic.passed) warnings.push(`Semantic: ${semantic.score * 100}%`);
  
  return { passed, literal, structure, semantic, warnings };
}