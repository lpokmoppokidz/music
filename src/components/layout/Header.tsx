import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
} from "lucide-react";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const handleLogout = () => {
    setShowDropdown(false);
    onLogout?.();
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="h-16 border-b border-border-light dark:border-border-dark flex items-center justify-between px-6 sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-40">
      <div className="flex items-center gap-4">
        <button className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary transition-all"
          >
            <User className="w-5 h-5 text-gray-500" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#181818] border border-border-light dark:border-border-dark rounded-md shadow-xl z-[60] py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
                <p className="font-semibold text-sm truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => setShowDropdown(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4 opacity-70" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-red-500 font-medium border-t border-border-light dark:border-border-dark mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
