const DICT_KEY = 'aura_learned_dict';

export const getLearnedWord = (word: string) => {
  try {
    const data = localStorage.getItem(DICT_KEY);
    if (!data) return null;
    const dict = JSON.parse(data);
    const cleanWord = word.trim().toLowerCase();
    return dict[cleanWord] || null;
  } catch (e) { return null; }
};

export const saveLearnedWord = (word: string, aiData: any) => {
  try {
    const data = localStorage.getItem(DICT_KEY);
    const dict = data ? JSON.parse(data) : {};
    const cleanWord = word.trim().toLowerCase();
    dict[cleanWord] = aiData;
    localStorage.setItem(DICT_KEY, JSON.stringify(dict));
  } catch (e) { console.error('Lưu từ thất bại', e); }
};
