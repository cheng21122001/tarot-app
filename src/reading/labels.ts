import { getCard } from '../cards/deck';
import type { CardPick } from './types';

export const ORDINALS = ['第一张', '第二张', '第三张'] as const;

export function orientationLabel(reversed: boolean): '正位' | '逆位' {
  return reversed ? '逆位' : '正位';
}

export function cardLabel(pick: CardPick | null): string {
  return pick ? `${getCard(pick.id).nameZh}·${orientationLabel(pick.reversed)}` : '未选牌';
}

export function cardDisplayName(pick: CardPick | null): string {
  return pick ? `${getCard(pick.id).nameZh} ${orientationLabel(pick.reversed)}` : '未选牌';
}
