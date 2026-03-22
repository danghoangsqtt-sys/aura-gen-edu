import { HybridDictionary, HybridDictEntry } from '../types';

let dictionaryCache: HybridDictionary | null = null;
const DICT_SOURCES = [
  '/dictionary.json',
  '/dict_it.json',
  '/dict_medical.json',
  '/dict_business.json',
  '/dict_marketing.json',
  '/dict_slang.json',
  '/dict_idioms.json',
  '/dict_phrasal_verbs.json',
  '/dict_ielts.json',
  '/dict_toeic.json'
];

export const searchOfflineDictionary = async (word: string): Promise<HybridDictEntry | null> => {
  try {
    // 1. Tải và gộp (merge) dữ liệu từ nhiều nguồn nếu chưa có cache
    if (!dictionaryCache) {
      console.info("[LocalDict] Initializing multi-source loading...");
      const fetchPromises = DICT_SOURCES.map(source => 
        fetch(source).then(res => {
          if (!res.ok) throw new Error(`Not found: ${source}`);
          return res.json();
        })
      );

      const results = await Promise.allSettled(fetchPromises);
      
      const mergedCache: HybridDictionary = {};
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          const dict = result.value;
          // Merge dữ liệu theo cấu trúc chữ cái đầu: { "a": { "apple": {...} } }
          for (const firstChar in dict) {
            if (!mergedCache[firstChar]) {
              mergedCache[firstChar] = {};
            }
            // Gộp các từ vựng vào nhóm chữ cái tương ứng
            Object.assign(mergedCache[firstChar], dict[firstChar]);
          }
          console.log(`[LocalDict] Loaded source: ${DICT_SOURCES[idx]}`);
        } else {
          console.warn(`[LocalDict] skipped source: ${DICT_SOURCES[idx]} (${result.reason})`);
        }
      });
      
      dictionaryCache = mergedCache;
    }

    if (!dictionaryCache || Object.keys(dictionaryCache).length === 0) return null;

    // 2. Chuẩn hóa từ vựng (BẮT BUỘC)
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return null;

    // 3. Tìm chữ cái đầu tiên
    const firstLetter = cleanWord.charAt(0);

    // 4. Check an toàn (BẮT BUỘC)
    if (!dictionaryCache[firstLetter]) return null;

    // 5. Truy cập vào nhóm từ vựng và trả về
    const wordGroup = dictionaryCache[firstLetter];
    return wordGroup[cleanWord] || null;
  } catch (error) {
    console.warn("[LocalDictService] Offline DB error:", error);
    return null;
  }
};

