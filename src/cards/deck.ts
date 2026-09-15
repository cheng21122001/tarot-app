export type CardGroup = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export interface Card {
  id: string;
  nameZh: string;
  nameEn: string;
  group: CardGroup;
  commonsFile: string;
  keywords: string[];
}

export const GROUP_LABELS: Record<CardGroup, string> = {
  major: '大阿卡纳',
  wands: '权杖',
  cups: '圣杯',
  swords: '宝剑',
  pentacles: '星币',
};

const MAJORS: [string, string, string][] = [
  ['愚人', 'The Fool', 'RWS_Tarot_00_Fool.jpg'],
  ['魔术师', 'The Magician', 'RWS_Tarot_01_Magician.jpg'],
  ['女祭司', 'The High Priestess', 'RWS_Tarot_02_High_Priestess.jpg'],
  ['皇后', 'The Empress', 'RWS_Tarot_03_Empress.jpg'],
  ['皇帝', 'The Emperor', 'RWS_Tarot_04_Emperor.jpg'],
  ['教皇', 'The Hierophant', 'RWS_Tarot_05_Hierophant.jpg'],
  ['恋人', 'The Lovers', 'RWS_Tarot_06_Lovers.jpg'],
  ['战车', 'The Chariot', 'RWS_Tarot_07_Chariot.jpg'],
  ['力量', 'Strength', 'RWS_Tarot_08_Strength.jpg'],
  ['隐士', 'The Hermit', 'RWS_Tarot_09_Hermit.jpg'],
  ['命运之轮', 'Wheel of Fortune', 'RWS_Tarot_10_Wheel_of_Fortune.jpg'],
  ['正义', 'Justice', 'RWS_Tarot_11_Justice.jpg'],
  ['倒吊人', 'The Hanged Man', 'RWS_Tarot_12_Hanged_Man.jpg'],
  ['死神', 'Death', 'RWS_Tarot_13_Death.jpg'],
  ['节制', 'Temperance', 'RWS_Tarot_14_Temperance.jpg'],
  ['恶魔', 'The Devil', 'RWS_Tarot_15_Devil.jpg'],
  ['塔', 'The Tower', 'RWS_Tarot_16_Tower.jpg'],
  ['星星', 'The Star', 'RWS_Tarot_17_Star.jpg'],
  ['月亮', 'The Moon', 'RWS_Tarot_18_Moon.jpg'],
  ['太阳', 'The Sun', 'RWS_Tarot_19_Sun.jpg'],
  ['审判', 'Judgement', 'RWS_Tarot_20_Judgement.jpg'],
  ['世界', 'The World', 'RWS_Tarot_21_World.jpg'],
];

const SUITS: { group: Exclude<CardGroup, 'major'>; zh: string; en: string; commons: string }[] = [
  { group: 'wands', zh: '权杖', en: 'Wands', commons: 'Wands' },
  { group: 'cups', zh: '圣杯', en: 'Cups', commons: 'Cups' },
  { group: 'swords', zh: '宝剑', en: 'Swords', commons: 'Swords' },
  { group: 'pentacles', zh: '星币', en: 'Pentacles', commons: 'Pents' },
];

const RANKS_ZH = ['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍从', '骑士', '王后', '国王'];
const NUMERALS_ZH = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const RANKS_EN = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];

const pad = (n: number) => String(n).padStart(2, '0');
const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

function buildDeck(): Card[] {
  const majors: Card[] = MAJORS.map(([zh, en, file], i) => ({
    id: `major-${pad(i)}`,
    nameZh: zh,
    nameEn: en,
    group: 'major',
    commonsFile: file,
    keywords: [zh, norm(en), String(i)],
  }));
  const minors: Card[] = SUITS.flatMap((suit) =>
    RANKS_ZH.map((rank, i) => {
      const n = i + 1;
      const nameZh = `${suit.zh}${rank}`;
      const nameEn = `${RANKS_EN[i]} of ${suit.en}`;
      const keywords = [nameZh, norm(nameEn)];
      if (n <= 10) keywords.push(`${suit.zh}${NUMERALS_ZH[i]}`, `${suit.zh}${n}`);
      if (n === 1) keywords.push(`${suit.zh}首牌`);
      return {
        id: `${suit.group}-${pad(n)}`,
        nameZh,
        nameEn,
        group: suit.group,
        commonsFile: `${suit.commons}${pad(n)}.jpg`,
        keywords,
      };
    }),
  );
  return [...majors, ...minors];
}

export const DECK: Card[] = buildDeck();
const BY_ID = new Map(DECK.map((c) => [c.id, c]));

export function getCard(id: string): Card {
  const card = BY_ID.get(id);
  if (!card) throw new Error(`Unknown card id: ${id}`);
  return card;
}

export function searchCards(query: string): Card[] {
  const q = norm(query);
  if (!q) return DECK;
  const exact = DECK.filter((c) => c.keywords.some((k) => k === q));
  if (exact.length) return exact;
  return DECK.filter((c) => c.keywords.some((k) => k.includes(q)));
}

export function cardImageUrl(id: string): string {
  return `${import.meta.env.BASE_URL}cards/${id}.webp`;
}
