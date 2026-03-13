"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  onSwitch?: () => void;
  className?: string;
  buttonClassName?: string;
};

export function LanguageSwitcher({
  onSwitch,
  className,
  buttonClassName,
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    onSwitch?.();
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={locale === "ja" ? "default" : "outline"}
        size="sm"
        onClick={() => switchLocale("ja")}
        className={buttonClassName}
      >
        日本語
      </Button>
      <Button
        variant={locale === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => switchLocale("en")}
        className={buttonClassName}
      >
        English
      </Button>
    </div>
  );
}
