import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitch } from "@/theme/theme-switch";
import { GithubLink } from "./github-link";

export function Header() {
  return (
    <header className="flex items-center justify-end p-4">
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeSwitch />
        <nav>
          <GithubLink />
        </nav>
      </div>
    </header>
  );
}
