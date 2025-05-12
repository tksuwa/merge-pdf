import { getRequestConfig } from 'next-intl/server';
import ja from './locales/ja.json';
import en from './locales/en.json';

const messages = {
  ja,
  en,
} as const;

export default getRequestConfig(async ({ locale }) => {
  if (!locale || !(locale in messages)) {
    locale = 'ja';
  }

  return {
    messages: messages[locale as keyof typeof messages],
    locale
  };
}); 