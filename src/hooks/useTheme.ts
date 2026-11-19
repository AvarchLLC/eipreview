import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "eipreview-theme";

function current(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);

  const apply = useCallback((t: Theme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem(KEY, t);
    } catch {
      // ignore (private mode)
    }
    setTheme(t);
  }, []);

  const toggle = useCallback(() => apply(current() === "dark" ? "light" : "dark"), [apply]);

  // Follow the system preference until the user makes an explicit choice.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(KEY);
      } catch {
        stored = null;
      }
      if (!stored) apply(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [apply]);

  return { theme, toggle };
}
