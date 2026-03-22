/**
 * Word Morphology Analyzer
 * Breaks down English words into prefix + root + suffix
 * with Vietnamese explanations for learners.
 */

interface MorphemePart {
  type: 'prefix' | 'root' | 'suffix';
  morpheme: string;
  meaning: string; // Vietnamese meaning
}

export interface MorphologyResult {
  word: string;
  parts: MorphemePart[];
  summary: string; // e.g. "un- (không) + break (vỡ) + -able (có thể) = không thể phá vỡ"
}

// Common English prefixes with Vietnamese meanings
const PREFIXES: [string, string][] = [
  ['anti', 'chống lại'],
  ['auto', 'tự động'],
  ['bi', 'hai, kép'],
  ['co', 'cùng'],
  ['counter', 'phản, ngược'],
  ['de', 'bỏ, loại bỏ'],
  ['dis', 'không, phủ định'],
  ['down', 'xuống'],
  ['en', 'làm cho'],
  ['em', 'làm cho'],
  ['ex', 'cựu, ngoài'],
  ['extra', 'ngoài, thêm'],
  ['fore', 'trước'],
  ['hyper', 'siêu, quá mức'],
  ['il', 'không (trước l)'],
  ['im', 'không (trước b,m,p)'],
  ['in', 'không, vào trong'],
  ['inter', 'giữa, lẫn nhau'],
  ['ir', 'không (trước r)'],
  ['macro', 'lớn, vĩ mô'],
  ['mal', 'xấu, sai'],
  ['micro', 'nhỏ, vi mô'],
  ['mid', 'giữa'],
  ['mini', 'nhỏ'],
  ['mis', 'sai, lầm'],
  ['mono', 'một'],
  ['multi', 'nhiều'],
  ['non', 'không, phi'],
  ['out', 'ngoài, vượt'],
  ['over', 'quá, trên'],
  ['post', 'sau'],
  ['pre', 'trước'],
  ['pro', 'ủng hộ, chuyên nghiệp'],
  ['re', 'lại, lặp lại'],
  ['semi', 'nửa, bán'],
  ['sub', 'dưới, phụ'],
  ['super', 'siêu, trên'],
  ['trans', 'xuyên, qua'],
  ['tri', 'ba'],
  ['ultra', 'cực kì'],
  ['un', 'không, phủ định'],
  ['under', 'dưới, thiếu'],
  ['uni', 'một, thống nhất'],
  ['up', 'lên'],
];

// Common English suffixes with Vietnamese meanings
const SUFFIXES: [string, string][] = [
  ['fulness', 'trạng thái đầy'],
  ['lessly', 'một cách không'],
  ['isation', 'quá trình hóa'],
  ['ization', 'quá trình hóa'],
  ['iveness', 'tính chất'],
  ['ousness', 'tính chất'],
  ['ment', 'hành động, kết quả'],
  ['ness', 'trạng thái, tính chất'],
  ['tion', 'hành động, quá trình'],
  ['sion', 'hành động, quá trình'],
  ['ation', 'hành động, quá trình'],
  ['ence', 'trạng thái, tính chất'],
  ['ance', 'trạng thái, tính chất'],
  ['able', 'có thể'],
  ['ible', 'có thể'],
  ['ful', 'đầy, nhiều'],
  ['less', 'không có, thiếu'],
  ['ous', 'có tính chất'],
  ['ious', 'có tính chất'],
  ['eous', 'có tính chất'],
  ['ive', 'có xu hướng'],
  ['al', 'thuộc về'],
  ['ial', 'thuộc về'],
  ['ical', 'thuộc về'],
  ['ly', 'một cách (trạng từ)'],
  ['er', 'người làm, hơn'],
  ['or', 'người làm'],
  ['ist', 'người theo, chuyên gia'],
  ['ism', 'chủ nghĩa, học thuyết'],
  ['ity', 'tính chất, trạng thái'],
  ['ty', 'tính chất'],
  ['ure', 'hành động, kết quả'],
  ['dom', 'lĩnh vực, trạng thái'],
  ['ship', 'mối quan hệ, vị trí'],
  ['ward', 'hướng về'],
  ['wards', 'hướng về'],
  ['wise', 'theo cách'],
  ['ize', 'làm cho, hóa'],
  ['ise', 'làm cho, hóa'],
  ['ify', 'làm cho'],
  ['ate', 'làm cho, có'],
  ['en', 'làm cho'],
  ['ing', 'đang (tiếp diễn)'],
  ['ed', 'đã (quá khứ)'],
  ['es', 'số nhiều'],
  ['s', 'số nhiều'],
];

// Common Latin/Greek roots with Vietnamese meanings
const ROOTS: [string, string][] = [
  ['act', 'hành động'],
  ['anim', 'sống, tinh thần'],
  ['ann', 'năm'],
  ['aud', 'nghe'],
  ['auto', 'tự'],
  ['bene', 'tốt'],
  ['bio', 'sống'],
  ['cap', 'nắm, đầu'],
  ['cede', 'đi'],
  ['ceed', 'đi'],
  ['cess', 'đi'],
  ['cent', 'trăm'],
  ['chron', 'thời gian'],
  ['cide', 'giết'],
  ['claim', 'kêu, đòi'],
  ['clud', 'đóng'],
  ['cog', 'biết'],
  ['corp', 'thân thể'],
  ['cosm', 'vũ trụ'],
  ['cred', 'tin'],
  ['cur', 'chạy'],
  ['cycl', 'vòng tròn'],
  ['dem', 'dân'],
  ['dict', 'nói'],
  ['doc', 'dạy'],
  ['duc', 'dẫn'],
  ['fact', 'làm'],
  ['fect', 'làm'],
  ['fer', 'mang'],
  ['fid', 'tin tưởng'],
  ['fin', 'kết thúc, giới hạn'],
  ['flex', 'uốn cong'],
  ['flect', 'uốn cong'],
  ['form', 'hình dạng'],
  ['fort', 'mạnh'],
  ['fract', 'vỡ'],
  ['gen', 'sinh ra'],
  ['geo', 'đất, địa'],
  ['grad', 'bước'],
  ['graph', 'viết, vẽ'],
  ['grat', 'vui, biết ơn'],
  ['gress', 'bước đi'],
  ['hab', 'có, sống'],
  ['hum', 'con người, đất'],
  ['ject', 'ném'],
  ['jud', 'xét xử'],
  ['jur', 'luật, thề'],
  ['lat', 'mang'],
  ['lect', 'chọn, đọc'],
  ['leg', 'luật, đọc'],
  ['liber', 'tự do'],
  ['loc', 'nơi'],
  ['log', 'lời, học'],
  ['logy', 'môn học'],
  ['luc', 'sáng'],
  ['man', 'tay'],
  ['manu', 'tay'],
  ['mar', 'biển'],
  ['mater', 'mẹ'],
  ['medi', 'giữa'],
  ['mem', 'nhớ'],
  ['ment', 'tâm trí'],
  ['metr', 'đo'],
  ['migr', 'di chuyển'],
  ['min', 'nhỏ'],
  ['mis', 'gửi'],
  ['mit', 'gửi'],
  ['mob', 'di chuyển'],
  ['mot', 'di chuyển'],
  ['mov', 'di chuyển'],
  ['mort', 'chết'],
  ['multi', 'nhiều'],
  ['nat', 'sinh ra'],
  ['neg', 'phủ nhận'],
  ['nom', 'tên, quy tắc'],
  ['norm', 'chuẩn mực'],
  ['not', 'đánh dấu'],
  ['nov', 'mới'],
  ['numer', 'số'],
  ['oper', 'làm việc'],
  ['opt', 'tốt nhất, chọn'],
  ['pac', 'hòa bình'],
  ['pass', 'chịu đựng'],
  ['path', 'cảm xúc, bệnh'],
  ['pater', 'cha'],
  ['ped', 'chân'],
  ['pel', 'đẩy'],
  ['pend', 'treo, phụ thuộc'],
  ['phon', 'âm thanh'],
  ['photo', 'ánh sáng'],
  ['plic', 'gấp'],
  ['pon', 'đặt'],
  ['port', 'mang'],
  ['pos', 'đặt'],
  ['poten', 'sức mạnh'],
  ['press', 'ép'],
  ['prim', 'đầu tiên'],
  ['prob', 'thử'],
  ['prov', 'thử, chứng minh'],
  ['psych', 'tâm trí'],
  ['punct', 'chấm, đâm'],
  ['put', 'tính toán'],
  ['quer', 'hỏi'],
  ['quest', 'hỏi, tìm'],
  ['rupt', 'vỡ'],
  ['sacr', 'thiêng'],
  ['scend', 'leo'],
  ['sci', 'biết'],
  ['scrib', 'viết'],
  ['script', 'viết'],
  ['sect', 'cắt'],
  ['sens', 'cảm'],
  ['sent', 'cảm'],
  ['sequ', 'theo'],
  ['serv', 'phục vụ, giữ'],
  ['sign', 'dấu hiệu'],
  ['simil', 'giống'],
  ['soci', 'xã hội'],
  ['sol', 'một mình'],
  ['solv', 'giải, tan'],
  ['spec', 'nhìn'],
  ['spect', 'nhìn'],
  ['spir', 'thở'],
  ['sta', 'đứng'],
  ['struct', 'xây dựng'],
  ['sum', 'cao nhất'],
  ['tact', 'chạm'],
  ['tain', 'giữ'],
  ['temp', 'thời gian'],
  ['ten', 'giữ'],
  ['tend', 'kéo dài'],
  ['tens', 'kéo căng'],
  ['terr', 'đất'],
  ['test', 'làm chứng'],
  ['therm', 'nhiệt'],
  ['tort', 'xoắn'],
  ['tract', 'kéo'],
  ['trib', 'cho, đóng góp'],
  ['turb', 'xáo trộn'],
  ['typ', 'loại, mẫu'],
  ['vac', 'trống'],
  ['val', 'giá trị, mạnh'],
  ['ven', 'đến'],
  ['vent', 'đến'],
  ['ver', 'thật'],
  ['verb', 'lời'],
  ['vert', 'quay'],
  ['vid', 'thấy'],
  ['vis', 'thấy'],
  ['vit', 'sống'],
  ['viv', 'sống'],
  ['voc', 'giọng, gọi'],
  ['vol', 'ý muốn'],
  ['volv', 'cuốn, quay'],
];

// Sort by length descending so longer matches take priority
const SORTED_PREFIXES = [...PREFIXES].sort((a, b) => b[0].length - a[0].length);
const SORTED_SUFFIXES = [...SUFFIXES].sort((a, b) => b[0].length - a[0].length);
const SORTED_ROOTS = [...ROOTS].sort((a, b) => b[0].length - a[0].length);

export function analyzeWordMorphology(word: string): MorphologyResult | null {
  const w = word.trim().toLowerCase();
  if (w.length < 4 || w.includes(' ')) return null; // Too short or multi-word

  const parts: MorphemePart[] = [];
  let remaining = w;

  // 1. Try to find prefix
  let foundPrefix: [string, string] | null = null;
  for (const [pfx, meaning] of SORTED_PREFIXES) {
    if (remaining.startsWith(pfx) && remaining.length > pfx.length + 2) {
      foundPrefix = [pfx, meaning];
      remaining = remaining.slice(pfx.length);
      parts.push({ type: 'prefix', morpheme: pfx, meaning });
      break;
    }
  }

  // 2. Try to find suffix
  let foundSuffix: [string, string] | null = null;
  for (const [sfx, meaning] of SORTED_SUFFIXES) {
    if (remaining.endsWith(sfx) && remaining.length > sfx.length + 1) {
      foundSuffix = [sfx, meaning];
      remaining = remaining.slice(0, remaining.length - sfx.length);
      break;
    }
  }

  // 3. Try to find root in the remaining part
  let foundRoot: [string, string] | null = null;
  for (const [root, meaning] of SORTED_ROOTS) {
    if (remaining.includes(root) && root.length >= 3) {
      foundRoot = [root, meaning];
      break;
    }
  }

  // Build the root part
  if (foundRoot) {
    parts.push({ type: 'root', morpheme: foundRoot[0], meaning: foundRoot[1] });
  } else if (remaining.length >= 2) {
    // Use remaining as root even without match
    parts.push({ type: 'root', morpheme: remaining, meaning: 'gốc từ' });
  }

  // Add suffix after root
  if (foundSuffix) {
    parts.push({ type: 'suffix', morpheme: foundSuffix[0], meaning: foundSuffix[1] });
  }

  // Only return if we found at least prefix or suffix (just root alone is not useful)
  if (!foundPrefix && !foundSuffix) return null;

  // Build summary
  const summaryParts = parts.map(p => {
    const label = p.type === 'prefix' ? `${p.morpheme}-` : p.type === 'suffix' ? `-${p.morpheme}` : p.morpheme;
    return `${label} (${p.meaning})`;
  });
  const summary = summaryParts.join(' + ');

  return { word: w, parts, summary };
}
