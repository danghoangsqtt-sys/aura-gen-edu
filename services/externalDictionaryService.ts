
export interface ExternalWordData {
  word: string;
  phonetic?: string;
  phonetics: { text: string; audio?: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }[];
    synonyms: string[];
    antonyms: string[];
  }[];
}

export const fetchExternalDictionary = async (word: string): Promise<ExternalWordData | null> => {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim().toLowerCase())}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data[0] as ExternalWordData;
  } catch (error) {
    console.error("External Dictionary Error:", error);
    return null;
  }
};

/**
 * Enrich a HybridDictEntry with data from the free external API.
 * This adds: synonyms, antonyms per meaning, extra examples, word forms info.
 */
export const enrichWithExternalData = async (word: string): Promise<{
  wordForms: { pos: string; form: string }[];
  allSynonyms: string[];
  allAntonyms: string[];
  extraMeanings: { pos: string; definition: string; example?: string; synonyms: string[]; antonyms: string[] }[];
  ukPhonetic?: string;
  usPhonetic?: string;
  ukAudioUrl?: string;
  usAudioUrl?: string;
} | null> => {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim().toLowerCase())}`);
    if (!response.ok) return null;
    const data = await response.json();
    const entry = data[0] as ExternalWordData;

    const wordForms: { pos: string; form: string }[] = [];
    const allSynonyms = new Set<string>();
    const allAntonyms = new Set<string>();
    const extraMeanings: { pos: string; definition: string; example?: string; synonyms: string[]; antonyms: string[] }[] = [];

    // Extract separate UK and US phonetics from the API data
    // The API returns phonetics array with audio URLs like:
    //   https://api.dictionaryapi.dev/media/pronunciations/en/hello-uk.mp3
    //   https://api.dictionaryapi.dev/media/pronunciations/en/hello-us.mp3
    let ukPhonetic: string | undefined;
    let usPhonetic: string | undefined;
    let ukAudioUrl: string | undefined;
    let usAudioUrl: string | undefined;

    for (const p of (entry.phonetics || [])) {
      const audioLower = (p.audio || '').toLowerCase();
      if (audioLower.includes('-uk') || audioLower.includes('_uk')) {
        ukPhonetic = p.text || ukPhonetic;
        ukAudioUrl = p.audio || ukAudioUrl;
      } else if (audioLower.includes('-us') || audioLower.includes('_us') || audioLower.includes('-au')) {
        usPhonetic = p.text || usPhonetic;
        usAudioUrl = p.audio || usAudioUrl;
      } else if (p.text && !ukPhonetic && !usPhonetic) {
        // Generic phonetic — assign to whichever is missing
        ukPhonetic = p.text;
      } else if (p.audio && !ukAudioUrl && !usAudioUrl) {
        ukAudioUrl = p.audio;
      }
    }

    // Fallback: use entry.phonetic if neither was found
    if (!ukPhonetic && !usPhonetic) {
      const fallback = entry.phonetic || entry.phonetics?.find(p => p.text)?.text;
      ukPhonetic = fallback;
      usPhonetic = fallback;
    }
    // If only one side found, don't copy to the other — leave undefined so UI can indicate

    for (const meaning of entry.meanings) {
      // Collect word forms
      wordForms.push({ pos: meaning.partOfSpeech, form: entry.word });

      // Collect top-level synonyms/antonyms
      meaning.synonyms?.forEach(s => allSynonyms.add(s));
      meaning.antonyms?.forEach(a => allAntonyms.add(a));

      // Collect per-definition data
      for (const def of meaning.definitions) {
        def.synonyms?.forEach(s => allSynonyms.add(s));
        def.antonyms?.forEach(a => allAntonyms.add(a));

        extraMeanings.push({
          pos: meaning.partOfSpeech,
          definition: def.definition,
          example: def.example,
          synonyms: def.synonyms || [],
          antonyms: def.antonyms || [],
        });
      }
    }

    // Also fetch related word forms via Datamuse
    try {
      const relRes = await fetch(`https://api.datamuse.com/words?rel_jja=${encodeURIComponent(word)}&max=5`);
      if (relRes.ok) {
        const relData = await relRes.json();
        relData.forEach((r: any) => allSynonyms.add(r.word));
      }
    } catch (_) { /* ignore */ }

    return {
      wordForms,
      allSynonyms: [...allSynonyms].slice(0, 12),
      allAntonyms: [...allAntonyms].slice(0, 8),
      extraMeanings,
      ukPhonetic,
      usPhonetic,
      ukAudioUrl,
      usAudioUrl,
    };
  } catch (error) {
    console.error("External Enrichment Error:", error);
    return null;
  }
};
