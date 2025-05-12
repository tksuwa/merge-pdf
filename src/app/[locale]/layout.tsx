import { I18nProvider } from "@/i18n/provider";
import { notFound } from "next/navigation";
import ja from "@/i18n/locales/ja.json";
import en from "@/i18n/locales/en.json";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitch } from "@/theme/theme-switch";

const messages = {
  ja,
  en,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  if (!(locale in messages)) notFound();

  return (
    <I18nProvider
      locale={locale}
      messages={messages[locale as keyof typeof messages]}
    >
      <div lang={locale} className="min-h-screen">
        <header className="fixed top-0 right-0 p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
          <ThemeSwitch />
        </header>
        <main className="container mx-auto px-4 pt-16">{children}</main>
      </div>
    </I18nProvider>
  );
}
