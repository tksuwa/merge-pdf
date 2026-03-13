import { PdfToImage } from "@/components/pdf-to-image";
import { JsonLd } from "@/components/json-ld";
import { Metadata } from "next";
import { SITE_URL, LOCALES } from "@/lib/constants";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const metadata = (await import(`@/i18n/metadata/${locale}.json`)).default;
  const pdfToImage = metadata.pdfToImage;

  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    languages[l] = `${SITE_URL}/${l}/pdf-to-image`;
  }

  return {
    title: pdfToImage.title,
    description: pdfToImage.description,
    keywords: pdfToImage.keywords,
    openGraph: pdfToImage.og,
    twitter: pdfToImage.twitter,
    alternates: {
      canonical: `${SITE_URL}/${locale}/pdf-to-image`,
      languages,
    },
  };
}

export default async function PdfToImagePage({ params }: Props) {
  const { locale } = await params;
  const metadata = (await import(`@/i18n/metadata/${locale}.json`)).default;
  const pdfToImage = metadata.pdfToImage;

  return (
    <>
      <JsonLd
        name={pdfToImage.title}
        description={pdfToImage.description}
        locale={locale}
        path="pdf-to-image"
      />
      <PdfToImage />
    </>
  );
}
