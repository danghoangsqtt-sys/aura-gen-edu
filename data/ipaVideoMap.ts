/**
 * IPA Symbol → Safe ASCII Video Filename Mapping
 * 
 * Windows filesystems and web servers cannot reliably handle
 * Unicode IPA characters (ʊ, θ, ʃ, ð, etc.) in filenames.
 * This map converts each IPA symbol to a human-readable ASCII slug.
 * 
 * Usage:
 *   getVideoFilename('ʊ')  → 'ipa_u_short'
 *   getVideoFilename('iː') → 'ipa_ee'
 *   Video path: `/videos/${getVideoFilename(symbol)}.mp4`
 */

const ipaVideoMap: Record<string, string> = {
  // ═══ MONOPHTHONGS (12) ═══
  'iː':  'ipa_ee',
  'ɪ':   'ipa_i_short',
  'ʊ':   'ipa_u_short',
  'uː':  'ipa_oo',
  'e':   'ipa_e',
  'ə':   'ipa_schwa',
  'ɜː':  'ipa_er',
  'ɔː':  'ipa_aw',
  'æ':   'ipa_ae',
  'ʌ':   'ipa_uh',
  'ɑː':  'ipa_ah',
  'ɒ':   'ipa_o_short',

  // ═══ DIPHTHONGS (8) ═══
  'ɪə':  'ipa_i_schwa',
  'eɪ':  'ipa_ei',
  'ɔɪ':  'ipa_oi',
  'aɪ':  'ipa_ai',
  'eə':  'ipa_e_schwa',
  'əʊ':  'ipa_ou',
  'aʊ':  'ipa_au',
  'ʊə':  'ipa_u_schwa',

  // ═══ CONSONANTS (24) ═══
  // Plosives
  'p':   'ipa_p',
  'b':   'ipa_b',
  't':   'ipa_t',
  'd':   'ipa_d',
  'k':   'ipa_k',
  'g':   'ipa_g',
  // Fricatives
  'f':   'ipa_f',
  'v':   'ipa_v',
  'θ':   'ipa_th_voiceless',
  'ð':   'ipa_th_voiced',
  's':   'ipa_s',
  'z':   'ipa_z',
  'ʃ':   'ipa_sh',
  'ʒ':   'ipa_zh',
  'h':   'ipa_h',
  // Affricates
  'tʃ':  'ipa_ch',
  'dʒ':  'ipa_j',
  // Nasals
  'm':   'ipa_m',
  'n':   'ipa_n',
  'ŋ':   'ipa_ng',
  // Approximants
  'l':   'ipa_l',
  'r':   'ipa_r',
  'j':   'ipa_y',
  'w':   'ipa_w',
};

/**
 * Get the safe ASCII video filename for an IPA symbol.
 * Falls back to a sanitized version if the symbol is not in the map.
 */
export function getVideoFilename(symbol: string): string {
  if (ipaVideoMap[symbol]) {
    return ipaVideoMap[symbol];
  }
  // Fallback: strip non-ASCII, replace ː with _long
  const sanitized = symbol
    .replace(/ː/g, '_long')
    .replace(/[^\w]/g, '')
    .toLowerCase();
  return `ipa_${sanitized || 'unknown'}`;
}

export default ipaVideoMap;
