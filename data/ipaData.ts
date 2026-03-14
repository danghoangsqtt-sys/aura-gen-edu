export interface IPASound {
  symbol: string; // e.g., "iː", "ɪ", "p", "b"
  type: 'vowel' | 'diphthong' | 'consonant';
  voiced: boolean;
  examples: string[]; // e.g., ["sheep", "eagle", "field"]
  youtubeQuery: string; // e.g., "how to pronounce i: sound english"
  description: string; // Brief mouth/tongue position guide
}

export const ipaSounds: IPASound[] = [
  // VOWELS (Monophthongs) - 5 sounds
  {
    symbol: "iː",
    type: "vowel",
    voiced: true,
    examples: ["sheep", "eagle", "field"],
    youtubeQuery: "how to pronounce i: sound english",
    description: "Long 'e' sound. Lips spread, tongue high and forward."
  },
  {
    symbol: "ɪ",
    type: "vowel",
    voiced: true,
    examples: ["ship", "mystery", "fish"],
    youtubeQuery: "how to pronounce ɪ sound english",
    description: "Short 'i' sound. Lips slightly parted, tongue relaxed."
  },
  {
    symbol: "ʊ",
    type: "vowel",
    voiced: true,
    examples: ["good", "put", "should"],
    youtubeQuery: "how to pronounce ʊ sound english",
    description: "Short 'u' sound. Lips slightly rounded, tongue pulled back."
  },
  {
    symbol: "uː",
    type: "vowel",
    voiced: true,
    examples: ["shoot", "blue", "two"],
    youtubeQuery: "how to pronounce u: sound english",
    description: "Long 'oo' sound. Lips tightly rounded, tongue high and back."
  },
  {
    symbol: "æ",
    type: "vowel",
    voiced: true,
    examples: ["cat", "apple", "black"],
    youtubeQuery: "how to pronounce æ sound english",
    description: "Short 'a' sound. Jaw dropped, lips spread, tongue flat."
  },

  // DIPHTHONGS - 3 sounds
  {
    symbol: "eɪ",
    type: "diphthong",
    voiced: true,
    examples: ["wait", "day", "eight"],
    youtubeQuery: "how to pronounce eɪ sound english",
    description: "Glides from 'e' to 'ɪ'. Jaw slightly open to nearly closed."
  },
  {
    symbol: "aɪ",
    type: "diphthong",
    voiced: true,
    examples: ["my", "sight", "fly"],
    youtubeQuery: "how to pronounce aɪ sound english",
    description: "Glides from 'a' to 'ɪ'. Jaw opens wide then closes slightly."
  },
  {
    symbol: "aʊ",
    type: "diphthong",
    voiced: true,
    examples: ["cow", "house", "brown"],
    youtubeQuery: "how to pronounce aʊ sound english",
    description: "Glides from 'a' to 'ʊ'. Jaw opens wide then lips round."
  },

  // CONSONANTS - 5 sounds
  {
    symbol: "p",
    type: "consonant",
    voiced: false,
    examples: ["pen", "copy", "happen"],
    youtubeQuery: "how to pronounce p sound english",
    description: "Voiceless bilabial plosive. Stop air with lips and release."
  },
  {
    symbol: "b",
    type: "consonant",
    voiced: true,
    examples: ["back", "baby", "job"],
    youtubeQuery: "how to pronounce b sound english",
    description: "Voiced bilabial plosive. Stop air with lips and release with voice."
  },
  {
    symbol: "θ",
    type: "consonant",
    voiced: false,
    examples: ["think", "both", "nothing"],
    youtubeQuery: "how to pronounce θ sound english",
    description: "Voiceless dental fricative. Tongue tip between teeth, blow air."
  },
  {
    symbol: "ð",
    type: "consonant",
    voiced: true,
    examples: ["this", "mother", "breathe"],
    youtubeQuery: "how to pronounce ð sound english",
    description: "Voiced dental fricative. Tongue tip between teeth, vibrate vocal cords."
  },
  {
    symbol: "ʃ",
    type: "consonant",
    voiced: false,
    examples: ["she", "crash", "nation"],
    youtubeQuery: "how to pronounce ʃ sound english",
    description: "Voiceless palato-alveolar fricative. Round lips, tongue near roof."
  }
];
