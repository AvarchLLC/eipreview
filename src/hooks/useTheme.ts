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
      // ignore
    }
    setTheme(t);
  }, []);

  // Circular clip-path transition from the click position
  const toggle = useCallback(
    (event?: React.MouseEvent | MouseEvent) => {
      const nextTheme: Theme = current() === "dark" ? "light" : "dark";

      // Check if browser supports View Transitions and user hasn't requested reduced motion
      const supportsViewTransition =
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!supportsViewTransition || !event) {
        apply(nextTheme);
        return;
      }

      const x = event.clientX;
      const y = event.clientY;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Trigger the native view transition
      const transition = (document as unknown as {
        startViewTransition: (cb: () => void) => { ready: Promise<void> };
      }).startViewTransition(() => {
        apply(nextTheme);
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];

        document.documentElement.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: 420,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });
    },
    [apply]
  );

  // Follow system preference until the user makes an explicit choice
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
