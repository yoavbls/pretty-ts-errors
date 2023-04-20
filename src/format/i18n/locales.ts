import { en } from './en';
import { ko } from './ko';

const supportedLocales = ['en', 'ko'] as const;
export type SupportedLocales = typeof supportedLocales[number];



export function getFormatRegexes(locale: string) {
  switch (locale) {
    case 'ko':
      return ko;
    case 'en':
    default:
      return en;
  }
}