export interface Bible {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  language: string;
  hasStrongs: boolean;
}

export interface Verse {
  id: number;
  bibleId: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface Scripture {
  reference: string;
  verses: Verse[];
  translation: string;
}
