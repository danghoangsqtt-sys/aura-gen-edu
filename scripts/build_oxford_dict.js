const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * CONFIGURATION
 */
const TARGET_FILE = path.resolve(__dirname, '../public/dictionary.json');
const TARGET_COUNT = 3000;
const BATCH_SIZE = 50;
const DELAY_MS = 2000; // 2s delay between batches to respect API limits

/**
 * SEED WORD LIST (Sample of Oxford 3000)
 * In a real scenario, this could be fetched from a CSV or Text file.
 */
const SEED_WORDS = [
  "abandon", "ability", "able", "abortion", "about", "above", "abroad", "absence", "absolute", "absolutely", "absorb", "abuse", "academic", "accept", "access", "accident", "accompany", "accomplish", "according", "account", "accurate", "accuse", "achieve", "achievement", "acid", "acknowledge", "acquire", "across", "action", "active", "activist", "activity", "actor", "actress", "actual", "actually", "address", "adequate", "adjust", "adjustment", "administration", "administrator", "admire", "admission", "admit", "adolescent", "adopt", "adult", "advance", "advanced", "advantage", "adventure", "advertising", "advice", "advise", "adviser", "advocate", "affair", "affect", "afford", "afraid", "after", "afternoon", "again", "against", "agency", "agenda", "agent", "aggressive", "agree", "agreement", "agricultural", "ahead", "aide", "aircraft", "airline", "airport", "album", "alcohol", "alive", "alliance", "allow", "almost", "alone", "along", "already", "also", "alter", "alternative", "although", "always", "amazing", "ambassador", "ambition", "amendment", "amount", "analysis", "analyst", "analyze", "ancient", "anger", "angle", "angry", "animal", "anniversary", "announce", "annual", "another", "answer", "anxiety", "anybody", "anymore", "anyone", "anything", "anyway", "anywhere", "apartment", "apparent", "apparently", "appeal", "appear", "appearance", "apple", "application", "apply", "appoint", "appointment", "appreciate", "approach", "appropriate", "approval", "approve", "approximate", "architect", "architecture", "area", "argue", "argument", "arise", "armed", "army", "around", "arrange", "arrangement", "arrest", "arrival", "arrive", "article", "artist", "artistic", "aside", "asleep", "aspect", "assault", "assert", "assess", "assessment", "asset", "assign", "assignment", "assist", "assistance", "assistant", "associate", "association", "assume", "assumption", "assurance", "assure", "athlete", "athletic", "atmosphere", "attach", "attack", "attempt", "attend", "attention", "attitude", "attorney", "attract", "attractive", "attribute", "audience", "author", "authority", "auto", "available", "average", "avoid", "award", "aware", "awareness", "awesome", "awful", "awkward"
];

/**
 * HELPER: Fetch data from Free Dictionary API
 */
function fetchWordData(word) {
  return new Promise((resolve, reject) => {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data)[0]);
          } catch (e) {
            reject(e);
          }
        } else if (res.statusCode === 404) {
          resolve(null); // Word not found
        } else {
          reject(new Error(`API Status: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => reject(err));
  });
}

/**
 * HELPER: Transform API result to Aura Gen Format
 */
function transformEntry(apiData) {
  if (!apiData) return null;
  
  const details = apiData.meanings.map(m => ({
    pos: m.partOfSpeech,
    means: m.definitions.slice(0, 3).map(d => ({
      mean: d.definition,
      example: d.example || "",
      synonyms: d.synonyms || [],
      antonyms: d.antonyms || []
    }))
  }));

  // Attempt to find phonetics safely
  const ukPhonetic = apiData.phonetics?.find(p => p.audio?.includes('-uk'))?.text || apiData.phonetics?.[0]?.text || "/.../";
  const usPhonetic = apiData.phonetics?.find(p => p.audio?.includes('-us'))?.text || apiData.phonetics?.[1]?.text || ukPhonetic;

  return {
    vocabulary: apiData.word,
    ipa: ukPhonetic,
    phonetics: {
       uk: ukPhonetic,
       us: usPhonetic
    },
    details: details
  };
}

/**
 * MAIN: Build Dictionary
 */
async function buildDictionary() {
  console.log('--- [Aura Gen] Oxford Dictionary Automation Starting ---');

  // 1. Load existing dictionary
  let dictionary = {};
  if (fs.existsSync(TARGET_FILE)) {
    try {
      dictionary = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading dictionary.json, starting fresh.');
    }
  }

  // 2. Count current words
  let currentWordsCount = 0;
  Object.keys(dictionary).forEach(letter => {
    currentWordsCount += Object.keys(dictionary[letter]).length;
  });
  console.log(`[Auto-Dict] Current word count: ${currentWordsCount} / ${TARGET_COUNT}`);

  if (currentWordsCount >= TARGET_COUNT) {
    console.log('Target reached. Exiting.');
    return;
  }

  // 3. Identify missing words from seed list
  const missingWords = SEED_WORDS.filter(word => {
    const letter = word[0].toLowerCase();
    return !dictionary[letter] || !dictionary[letter][word.toLowerCase()];
  });

  console.log(`[Auto-Dict] Found ${missingWords.length} missing words from seed list.`);

  // 4. Batch Processing
  for (let i = 0; i < missingWords.length; i += BATCH_SIZE) {
    const batch = missingWords.slice(i, i + BATCH_SIZE);
    console.log(`[Auto-Dict] Processing Batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

    for (const word of batch) {
      process.stdout.write(`Fetching ${word}... `);
      try {
        const raw = await fetchWordData(word);
        const transformed = transformEntry(raw);
        
        if (transformed) {
          const letter = word[0].toLowerCase();
          if (!dictionary[letter]) dictionary[letter] = {};
          dictionary[letter][word.toLowerCase()] = transformed;
          process.stdout.write('OK\n');
        } else {
          process.stdout.write('Not Found (404)\n');
        }
      } catch (err) {
        console.error(`\n[Error] Failed to fetch "${word}": ${err.message}`);
      }
    }

    // 5. Safe Save
    fs.writeFileSync(TARGET_FILE, JSON.stringify(dictionary, null, 2), 'utf8');
    
    // Recalculate count
    let newCount = 0;
    Object.keys(dictionary).forEach(letter => newCount += Object.keys(dictionary[letter]).length);
    console.log(`[Auto-Dict] Batch saved! Progress: ${newCount} / ${TARGET_COUNT}`);

    if (newCount >= TARGET_COUNT) break;

    // 6. Delay
    console.log(`[Auto-Dict] Sleeping for ${DELAY_MS}ms to respect API...`);
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log('--- [Aura Gen] Dictionary Sync Complete ---');
}

buildDictionary();
