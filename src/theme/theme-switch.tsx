"use client";

import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors cursor-pointer",
        "bg-primary/20 hover:bg-primary/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div
        className={cn(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background transition-transform",
          "flex items-center justify-center",
          theme === "dark" ? "translate-x-5" : "translate-x-0"
        )}
      >
        {theme === "dark" ? (
          <Moon className="h-3 w-3 text-muted-foreground" />
        ) : (
          <Sun className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}
