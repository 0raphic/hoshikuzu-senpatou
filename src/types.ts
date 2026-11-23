export interface NavItem {
  label: string;
  labelEn: string;
  href: string;
  icon?: string;
}

export type Mood =
  | 'star'
  | 'moon'
  | 'coffee'
  | 'cat'
  | 'music'
  | 'heart'
  | 'cloud'
  | 'rain'
  | 'snow'
  | 'game'
  | 'book'
  | 'sparkle';

export type WorkStatus = '完成' | '制作中' | '构思中' | '暂停';