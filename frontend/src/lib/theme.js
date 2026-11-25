import { useEffect } from "react";
import { create } from "zustand";

const KEY = "shyfly-theme"; // 'light' | 'dark' (absent = follow system)
const mq = () => window.matchMedia("(prefers-color-scheme: dark)");

const stored = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
};
const resolve = () => stored() || (mq().matches ? "dark" : "light");

export function applyTheme(t) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.style.colorScheme = t;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", t === "dark" ? "#14090f" : "#6b1544");
}

export const useTheme = create((set, get) => ({
  theme: typeof window === "undefined" ? "light" : resolve(),
  set: (t) => {
    try {
      localStorage.setItem(KEY, t);
    } catch {}
    applyTheme(t);
    set({ theme: t });
  },
  toggle: () => get().set(get().theme === "dark" ? "light" : "dark"),
}));

// call once at startup: sync class + follow OS changes until the user picks manually
export function initTheme() {
  applyTheme(useTheme.getState().theme);
  mq().addEventListener?.("change", (e) => {
    if (!stored()) {
      const t = e.matches ? "dark" : "light";
      applyTheme(t);
      useTheme.setState({ theme: t });
    }
  });
}

// printable pages (invoice) always render light
export function useForceLight() {
  useEffect(() => {
    const root = document.documentElement;
    const was = root.classList.contains("dark");
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    return () => {
      if (was) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      }
    };
  }, []);
}
