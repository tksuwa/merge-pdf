import { I18nProvider } from "@/i18n/provider";
import { notFound } from "next/navigation";
import ja from "@/i18n/locales/ja.json";
import en from "@/i18n/locales/en.json";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const messages = {
  ja,
  en,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locale in messages)) notFound();

  return (
    <I18nProvider
      locale={locale}
      messages={messages[locale as keyof typeof messages]}
    >
      <div lang={locale} className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto px-4 flex-grow">{children}</main>
        <Footer />
      </div>
    </I18nProvider>
  );
}
