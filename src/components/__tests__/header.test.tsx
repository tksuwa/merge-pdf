import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/header";
import { LanguageSwitcher } from "@/components/language-switcher";

const push = vi.fn();
const mockLocale = vi.fn<() => string>();
const mockPathname = vi.fn<() => string>();

vi.mock("next-intl", () => ({
  useLocale: () => mockLocale(),
  useTranslations: (namespace?: string) => {
    if (namespace === "nav") {
      return (key: string) =>
        ({
          merge: "PDF結合",
          pdfToImage: "PDF→画像",
        })[key] ?? key;
    }

    if (namespace === "aria") {
      return (key: string) =>
        ({
          openMenu: "メニューを開く",
          closeMenu: "メニューを閉じる",
        })[key] ?? key;
    }

    return (key: string) => key;
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({
    push,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/theme/theme-switch", () => ({
  ThemeSwitch: () => <button type="button">Theme</button>,
}));

afterEach(() => {
  cleanup();
});

describe("Header", () => {
  beforeEach(() => {
    push.mockReset();
    mockLocale.mockReturnValue("ja");
    mockPathname.mockReturnValue("/ja");
  });

  it("renders nav links and utility controls", () => {
    const { container } = render(<Header />);
    const desktopHeader = within(
      container.querySelector('[data-testid="desktop-header"]') as HTMLElement
    );

    expect(desktopHeader.getByRole("tab", { name: "PDF結合" })).toHaveAttribute(
      "href",
      "/ja"
    );
    expect(
      desktopHeader.getByRole("tab", { name: "PDF→画像" })
    ).toHaveAttribute(
      "href",
      "/ja/pdf-to-image"
    );
    expect(
      desktopHeader.getByRole("button", { name: "日本語" })
    ).toBeInTheDocument();
    expect(
      desktopHeader.getByRole("button", { name: "English" })
    ).toBeInTheDocument();
    expect(
      desktopHeader.getByRole("button", { name: "Theme" })
    ).toBeInTheDocument();
    expect(
      desktopHeader.getByRole("link", { name: "GitHubリポジトリ" })
    ).toBeInTheDocument();
  });

  it("restores the desktop inline layout and toggles a mobile hamburger menu", () => {
    const { container } = render(<Header />);
    const desktopHeader = container.querySelector(
      '[data-testid="desktop-header"]'
    ) as HTMLElement;
    const mobileHeader = container.querySelector(
      '[data-testid="mobile-header"]'
    ) as HTMLElement;

    expect(desktopHeader).toHaveClass(
      "hidden",
      "items-center",
      "justify-between",
      "sm:flex"
    );
    expect(
      within(mobileHeader).getByRole("button", { name: "メニューを開く" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();

    fireEvent.click(
      within(mobileHeader).getByRole("button", { name: "メニューを開く" })
    );

    const mobileMenu = screen.getByTestId("mobile-menu");
    const mobileMenuQueries = within(mobileMenu);

    expect(
      within(mobileHeader).getByRole("button", { name: "メニューを閉じる" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(mobileMenuQueries.getByRole("tab", { name: "PDF結合" })).toHaveAttribute(
      "href",
      "/ja"
    );
    expect(
      mobileMenuQueries.getByRole("tab", { name: "PDF→画像" })
    ).toHaveAttribute("href", "/ja/pdf-to-image");
    expect(
      mobileMenuQueries.getByRole("button", { name: "日本語" })
    ).toBeInTheDocument();
    expect(
      mobileMenuQueries.getByRole("button", { name: "English" })
    ).toBeInTheDocument();
  });
});

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    push.mockReset();
    mockLocale.mockReturnValue("ja");
    mockPathname.mockReturnValue("/ja");
  });

  it("keeps the default desktop layout", () => {
    const { container } = render(<LanguageSwitcher />);

    const root = container.firstElementChild;

    expect(root).not.toBeNull();
    expect(root).toHaveClass("flex", "items-center", "gap-2");
    expect(screen.getByRole("button", { name: "日本語" })).not.toHaveClass(
      "w-full"
    );
    expect(screen.getByRole("button", { name: "English" })).not.toHaveClass(
      "w-full"
    );
  });
});
