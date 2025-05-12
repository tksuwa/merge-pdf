"use client";

import { NextIntlClientProvider } from "next-intl";
import { ReactNode } from "react";
import ja from "./locales/ja.json";
import en from "./locales/en.json";

type Messages = typeof ja | typeof en;

type Props = {
  locale: string;
  children: ReactNode;
  messages: Messages;
};

export function I18nProvider({ locale, children, messages }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
