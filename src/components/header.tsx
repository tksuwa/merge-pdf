"use client";

import { useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitch } from "@/theme/theme-switch";
import { GithubLink } from "./github-link";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Combine, ImageDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Header() {
  const t = useTranslations("nav");
  const tAria = useTranslations("aria");
  const locale = useLocale();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    {
      href: `/${locale}`,
      label: t("merge"),
      key: "merge",
      icon: Combine,
    },
    {
      href: `/${locale}/pdf-to-image`,
      label: t("pdfToImage"),
      key: "pdfToImage",
      icon: ImageDown,
    },
  ];

  const activeLink = navLinks.find((link) => pathname === link.href) ?? navLinks[0];
  const ActiveIcon = activeLink.icon;

  return (
    <header className="p-4">
      <div
        data-testid="mobile-header"
        className="flex items-center justify-between gap-3 sm:hidden"
      >
        <div className="inline-flex min-w-0 items-center gap-2 rounded-full border bg-muted/40 px-4 py-2 text-sm font-medium">
          <ActiveIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{activeLink.label}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          aria-controls="mobile-header-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? tAria("closeMenu") : tAria("openMenu")}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isMenuOpen ? (
        <div
          id="mobile-header-menu"
          data-testid="mobile-menu"
          className="mt-3 space-y-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur-sm sm:hidden"
        >
          <nav className="flex flex-col gap-2" role="tablist">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.key}
                  href={link.href}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 border-t pt-3">
            <div className="min-w-0 flex-1">
              <LanguageSwitcher
                onSwitch={() => setIsMenuOpen(false)}
                className="grid min-w-0 grid-cols-2 gap-2"
                buttonClassName="w-full min-w-0"
              />
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <ThemeSwitch />
              <GithubLink />
            </div>
          </div>
        </div>
      ) : null}

      <div
        data-testid="desktop-header"
        className="hidden sm:flex items-center justify-between"
      >
        <nav
          className="inline-flex items-center rounded-full border bg-muted/40 p-1 gap-0.5"
          role="tablist"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.key}
                href={link.href}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-200 select-none min-h-[44px]",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <ThemeSwitch />
          <nav className="flex items-center gap-2">
            <GithubLink />
          </nav>
        </div>
      </div>
    </header>
  );
}
