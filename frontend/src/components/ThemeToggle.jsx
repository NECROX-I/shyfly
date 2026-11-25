import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../lib/theme";

export default function ThemeToggle({
  className = "p-2 transition hover:text-rose-500",
  size = 20,
}) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <FiSun size={size} /> : <FiMoon size={size} />}
    </button>
  );
}
