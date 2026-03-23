export interface PracticeWord {
  word: string;
  ipa: string;
}

export interface PracticeSentence {
  sentence: string;
  ipa: string;
}

export interface IPASound {
  symbol: string;
  type: 'monophthong' | 'diphthong' | 'consonant';
  voiced: boolean;
  examples: string[];
  youtubeQuery: string;
  description: string;
  pairTarget?: string;
  minimalPairs?: { word1: string; word2: string }[];
  practiceWords?: PracticeWord[];
  practiceSentences?: PracticeSentence[];
}

export const ipaSounds: IPASound[] = [
  // ==========================================
  // MONOPHTHONGS (12 Sounds)
  // Row 1: High
  { symbol: "iː", type: "monophthong", voiced: true, examples: ["sheep", "eagle", "field"], youtubeQuery: "how to pronounce i: sound english", description: "Long 'e' sound. Lips spread, tongue high and forward.", pairTarget: "ɪ", minimalPairs: [{word1: "sheep", word2: "ship"}, {word1: "reach", word2: "rich"}] },
  { symbol: "ɪ", type: "monophthong", voiced: true, examples: ["ship", "mystery", "fish"], youtubeQuery: "how to pronounce ɪ sound english", description: "Short 'i' sound. Lips slightly parted, tongue relaxed.", pairTarget: "iː", minimalPairs: [{word1: "ship", word2: "sheep"}, {word1: "rich", word2: "reach"}] },
  { symbol: "ʊ", type: "monophthong", voiced: true, examples: ["good", "put", "should"], youtubeQuery: "how to pronounce ʊ sound english", description: "Short 'u' sound. Lips slightly rounded, tongue pulled back.", pairTarget: "uː", minimalPairs: [{word1: "look", word2: "Luke"}, {word1: "full", word2: "fool"}] },
  { symbol: "uː", type: "monophthong", voiced: true, examples: ["shoot", "blue", "two"], youtubeQuery: "how to pronounce u: sound english", description: "Long 'oo' sound. Lips tightly rounded, tongue high and back.", pairTarget: "ʊ", minimalPairs: [{word1: "Luke", word2: "look"}, {word1: "fool", word2: "full"}] },
  // Row 2: Mid
  { symbol: "e", type: "monophthong", voiced: true, examples: ["bed", "head", "said"], youtubeQuery: "how to pronounce e sound english", description: "Short 'e' sound. Jaw slightly dropped, lips unrounded.", pairTarget: "æ", minimalPairs: [{word1: "bed", word2: "bad"}, {word1: "men", word2: "man"}] },
  { symbol: "ə", type: "monophthong", voiced: true, examples: ["teacher", "about", "today"], youtubeQuery: "how to pronounce schwa ə sound english", description: "Schwa. Completely relaxed mouth and tongue. Very short.", pairTarget: "ʌ", minimalPairs: [{word1: "sofa", word2: "suffix"}, {word1: "ago", word2: "ugly"}] },
  { symbol: "ɜː", type: "monophthong", voiced: true, examples: ["bird", "work", "hurt"], youtubeQuery: "how to pronounce ɜ: sound english", description: "Long central vowel. Lips relaxed, mid mouth opening.", pairTarget: "ɔː", minimalPairs: [{word1: "bird", word2: "board"}, {word1: "work", word2: "walk"}] },
  { symbol: "ɔː", type: "monophthong", voiced: true, examples: ["door", "more", "course"], youtubeQuery: "how to pronounce ɔ: sound english", description: "Long 'o' or 'aw' sound. Lips rounded, tongue low and back.", pairTarget: "ɒ", minimalPairs: [{word1: "caught", word2: "cot"}, {word1: "port", word2: "pot"}] },
  // Row 3: Low
  { symbol: "æ", type: "monophthong", voiced: true, examples: ["cat", "apple", "black"], youtubeQuery: "how to pronounce æ sound english", description: "Short 'a' sound. Jaw dropped widely, lips spread.", pairTarget: "e", minimalPairs: [{word1: "bad", word2: "bed"}, {word1: "man", word2: "men"}] },
  { symbol: "ʌ", type: "monophthong", voiced: true, examples: ["up", "cup", "money"], youtubeQuery: "how to pronounce ʌ sound english", description: "Short 'uh' sound. Jaw drops slightly, lips unrounded.", pairTarget: "æ", minimalPairs: [{word1: "cup", word2: "cap"}, {word1: "hut", word2: "hat"}] },
  { symbol: "ɑː", type: "monophthong", voiced: true, examples: ["car", "father", "start"], youtubeQuery: "how to pronounce ɑ: sound english", description: "Long 'ah' sound. Jaw dropped fully, tongue low.", pairTarget: "ʌ", minimalPairs: [{word1: "heart", word2: "hut"}, {word1: "dark", word2: "duck"}] },
  { symbol: "ɒ", type: "monophthong", voiced: true, examples: ["hot", "stop", "box"], youtubeQuery: "how to pronounce ɒ sound english", description: "Short 'o' sound. Lips slightly rounded, jaw dropped.", pairTarget: "ɔː", minimalPairs: [{word1: "cot", word2: "caught"}, {word1: "pot", word2: "port"}] },

  // ==========================================
  // DIPHTHONGS (8 Sounds)
  // Ending in ɪ
  { symbol: "ɪə", type: "diphthong", voiced: true, examples: ["here", "near", "ear"], youtubeQuery: "how to pronounce ɪə sound english", description: "Glides from 'ɪ' to 'ə'. Mostly in British English.", pairTarget: "eə", minimalPairs: [{word1: "here", word2: "hair"}, {word1: "ear", word2: "air"}] },
  { symbol: "eɪ", type: "diphthong", voiced: true, examples: ["wait", "day", "eight"], youtubeQuery: "how to pronounce eɪ sound english", description: "Glides from 'e' to 'ɪ'. Jaw slightly open to nearly closed.", pairTarget: "aɪ", minimalPairs: [{word1: "wait", word2: "white"}, {word1: "day", word2: "die"}] },
  { symbol: "ɔɪ", type: "diphthong", voiced: true, examples: ["boy", "coin", "voice"], youtubeQuery: "how to pronounce ɔɪ sound english", description: "Glides from 'ɔ' to 'ɪ'. Lips unround slightly." },
  { symbol: "aɪ", type: "diphthong", voiced: true, examples: ["my", "sight", "fly"], youtubeQuery: "how to pronounce aɪ sound english", description: "Glides from 'a' to 'ɪ'. Jaw opens wide then closes slightly.", pairTarget: "eɪ", minimalPairs: [{word1: "white", word2: "wait"}, {word1: "die", word2: "day"}] },
  // Ending in ʊ
  { symbol: "eə", type: "diphthong", voiced: true, examples: ["hair", "there", "care"], youtubeQuery: "how to pronounce eə sound english", description: "Glides from 'e' to 'ə'. Mostly in British English.", pairTarget: "ɪə", minimalPairs: [{word1: "hair", word2: "here"}, {word1: "air", word2: "ear"}] },
  { symbol: "əʊ", type: "diphthong", voiced: true, examples: ["show", "no", "boat"], youtubeQuery: "how to pronounce əʊ sound english", description: "Glides from 'ə' to 'ʊ'. Lips round during the sound.", pairTarget: "aʊ", minimalPairs: [{word1: "no", word2: "now"}, {word1: "boat", word2: "bout"}] },
  { symbol: "aʊ", type: "diphthong", voiced: true, examples: ["cow", "house", "brown"], youtubeQuery: "how to pronounce aʊ sound english", description: "Glides from 'a' to 'ʊ'. Jaw opens wide then lips round.", pairTarget: "əʊ", minimalPairs: [{word1: "now", word2: "no"}, {word1: "bout", word2: "boat"}] },
  { symbol: "ʊə", type: "diphthong", voiced: true, examples: ["tour", "poor", "sure"], youtubeQuery: "how to pronounce ʊə sound english", description: "Glides from 'ʊ' to 'ə'. Mostly in British English." },

  // ==========================================
  // CONSONANTS (24 Sounds)
  // Stops (Plosives)
  { symbol: "p", type: "consonant", voiced: false, examples: ["pen", "copy", "happen"], youtubeQuery: "how to pronounce p sound english", description: "Voiceless bilabial plosive.", pairTarget: "b", minimalPairs: [{word1: "pea", word2: "bee"}, {word1: "pat", word2: "bat"}] },
  { symbol: "b", type: "consonant", voiced: true, examples: ["back", "baby", "job"], youtubeQuery: "how to pronounce b sound english", description: "Voiced bilabial plosive.", pairTarget: "p", minimalPairs: [{word1: "bee", word2: "pea"}, {word1: "bat", word2: "pat"}] },
  { symbol: "t", type: "consonant", voiced: false, examples: ["tea", "tight", "button"], youtubeQuery: "how to pronounce t sound english", description: "Voiceless alveolar plosive.", pairTarget: "d", minimalPairs: [{word1: "tie", word2: "die"}, {word1: "tear", word2: "dear"}] },
  { symbol: "d", type: "consonant", voiced: true, examples: ["day", "ladder", "odd"], youtubeQuery: "how to pronounce d sound english", description: "Voiced alveolar plosive.", pairTarget: "t", minimalPairs: [{word1: "die", word2: "tie"}, {word1: "dear", word2: "tear"}] },
  { symbol: "k", type: "consonant", voiced: false, examples: ["key", "clock", "school"], youtubeQuery: "how to pronounce k sound english", description: "Voiceless velar plosive.", pairTarget: "g", minimalPairs: [{word1: "cap", word2: "gap"}, {word1: "coat", word2: "goat"}] },
  { symbol: "g", type: "consonant", voiced: true, examples: ["get", "giggle", "ghost"], youtubeQuery: "how to pronounce g sound english", description: "Voiced velar plosive.", pairTarget: "k", minimalPairs: [{word1: "gap", word2: "cap"}, {word1: "goat", word2: "coat"}] },
  
  // Fricatives
  { symbol: "f", type: "consonant", voiced: false, examples: ["fat", "coffee", "rough"], youtubeQuery: "how to pronounce f sound english", description: "Voiceless labiodental fricative.", pairTarget: "v", minimalPairs: [{word1: "fan", word2: "van"}, {word1: "half", word2: "halve"}] },
  { symbol: "v", type: "consonant", voiced: true, examples: ["view", "heavy", "move"], youtubeQuery: "how to pronounce v sound english", description: "Voiced labiodental fricative.", pairTarget: "f", minimalPairs: [{word1: "van", word2: "fan"}, {word1: "halve", word2: "half"}] },
  { symbol: "θ", type: "consonant", voiced: false, examples: ["think", "both", "nothing"], youtubeQuery: "how to pronounce θ sound english", description: "Voiceless dental fricative.", pairTarget: "ð", minimalPairs: [{word1: "thigh", word2: "thy"}] },
  { symbol: "ð", type: "consonant", voiced: true, examples: ["this", "mother", "breathe"], youtubeQuery: "how to pronounce ð sound english", description: "Voiced dental fricative.", pairTarget: "θ", minimalPairs: [{word1: "thy", word2: "thigh"}] },
  { symbol: "s", type: "consonant", voiced: false, examples: ["soon", "cease", "sister"], youtubeQuery: "how to pronounce s sound english", description: "Voiceless alveolar fricative.", pairTarget: "z", minimalPairs: [{word1: "sip", word2: "zip"}, {word1: "sue", word2: "zoo"}] },
  { symbol: "z", type: "consonant", voiced: true, examples: ["zero", "music", "buzz"], youtubeQuery: "how to pronounce z sound english", description: "Voiced alveolar fricative.", pairTarget: "s", minimalPairs: [{word1: "zip", word2: "sip"}, {word1: "zoo", word2: "sue"}] },
  { symbol: "ʃ", type: "consonant", voiced: false, examples: ["she", "crash", "nation"], youtubeQuery: "how to pronounce ʃ sound english", description: "Voiceless palato-alveolar fricative.", pairTarget: "ʒ", minimalPairs: [{word1: "Aleutian", word2: "allusion"}] },
  { symbol: "ʒ", type: "consonant", voiced: true, examples: ["pleasure", "vision", "beige"], youtubeQuery: "how to pronounce ʒ sound english", description: "Voiced palato-alveolar fricative.", pairTarget: "ʃ", minimalPairs: [{word1: "allusion", word2: "Aleutian"}] },
  { symbol: "h", type: "consonant", voiced: false, examples: ["hot", "whole", "ahead"], youtubeQuery: "how to pronounce h sound english", description: "Voiceless glottal fricative." },

  // Affricates
  { symbol: "tʃ", type: "consonant", voiced: false, examples: ["church", "match", "nature"], youtubeQuery: "how to pronounce tʃ sound english", description: "Voiceless palato-alveolar affricate.", pairTarget: "dʒ", minimalPairs: [{word1: "cheap", word2: "jeep"}, {word1: "choke", word2: "joke"}] },
  { symbol: "dʒ", type: "consonant", voiced: true, examples: ["judge", "age", "soldier"], youtubeQuery: "how to pronounce dʒ sound english", description: "Voiced palato-alveolar affricate.", pairTarget: "tʃ", minimalPairs: [{word1: "jeep", word2: "cheap"}, {word1: "joke", word2: "choke"}] },

  // Nasals
  { symbol: "m", type: "consonant", voiced: true, examples: ["more", "hammer", "sum"], youtubeQuery: "how to pronounce m sound english", description: "Voiced bilabial nasal.", pairTarget: "n", minimalPairs: [{word1: "map", word2: "nap"}, {word1: "some", word2: "sun"}] },
  { symbol: "n", type: "consonant", voiced: true, examples: ["nice", "funny", "sun"], youtubeQuery: "how to pronounce n sound english", description: "Voiced alveolar nasal.", pairTarget: "ŋ", minimalPairs: [{word1: "sin", word2: "sing"}, {word1: "ran", word2: "rang"}] },
  { symbol: "ŋ", type: "consonant", voiced: true, examples: ["ring", "anger", "thanks"], youtubeQuery: "how to pronounce ŋ sound english", description: "Voiced velar nasal.", pairTarget: "n", minimalPairs: [{word1: "sing", word2: "sin"}, {word1: "rang", word2: "ran"}] },

  // Approximants
  { symbol: "l", type: "consonant", voiced: true, examples: ["light", "valley", "feel"], youtubeQuery: "how to pronounce l sound english", description: "Voiced alveolar lateral approximant.", pairTarget: "r", minimalPairs: [{word1: "light", word2: "right"}, {word1: "load", word2: "road"}] },
  { symbol: "r", type: "consonant", voiced: true, examples: ["right", "wrong", "sorry"], youtubeQuery: "how to pronounce r sound english", description: "Voiced alveolar approximant.", pairTarget: "l", minimalPairs: [{word1: "right", word2: "light"}, {word1: "road", word2: "load"}] },
  { symbol: "j", type: "consonant", voiced: true, examples: ["yet", "use", "beauty"], youtubeQuery: "how to pronounce j sound english", description: "Voiced palatal approximant." },
  { symbol: "w", type: "consonant", voiced: true, examples: ["wet", "one", "when"], youtubeQuery: "how to pronounce w sound english", description: "Voiced labio-velar approximant.", pairTarget: "v", minimalPairs: [{word1: "went", word2: "vent"}, {word1: "wine", word2: "vine"}] }
];
