import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import ja from "@/i18n/locales/ja.json";
import en from "@/i18n/locales/en.json";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Metadata } from "next";

const messages = {
  ja,
  en,
};

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!(locale in messages)) notFound();

  const metadata = (await import(`@/i18n/metadata/${locale}.json`)).default;

  return {
    title: {
      template: "%s | PDF Merger",
      default: metadata.title,
    },
    description: metadata.description,
    keywords: metadata.keywords,
    openGraph: metadata.og,
    twitter: metadata.twitter,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locale in messages)) notFound();

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale as keyof typeof messages]}
      timeZone={timeZone}
    >
      <div lang={locale} className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto px-4 flex-grow">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
