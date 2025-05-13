import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  const locale = acceptLanguage.toLowerCase().includes("ja") ? "ja" : "en";

  redirect(`/${locale}`);
}
