import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Music, Headphones, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth/AuthProvider";

export default function LoginPage() {
  const [isDark, setIsDark] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    setIsLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
    } catch (err: any) {
      setError(err.response?.data?.error || "Google Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isRegister) {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col transition-colors duration-200">
      {/* Nav */}
      <nav className="w-full px-6 h-14 flex items-center justify-between fixed top-0 left-0 bg-transparent z-10">
        <div className="flex items-center gap-2 text-text-primary-light dark:text-text-primary-dark">
          <Music className="w-5 h-5" />
          <span className="font-semibold text-sm">EzConv Music</span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark transition-colors"
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 2c-1.05 0-2.05.16-3 .46 1.72 1.07 2.91 2.88 3.09 5.04C9.39 9.5 8.08 11.04 6.37 11.5c-1.35.36-2.78.1-3.96-.7C2.16 12.05 2 13.05 2 14c0 3.87 3.13 7 7 7s7-3.13 7-7-3.13-7-7-7z" />
            </svg>
          )}
        </button>
      </nav>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-card-light dark:bg-card-dark rounded-lg shadow-lg dark:shadow-none border border-border-light dark:border-border-dark p-8 md:p-12 transition-all duration-200">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-md flex items-center justify-center mb-4 text-2xl text-text-secondary-light dark:text-text-secondary-dark">
              <Headphones className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-text-primary-light dark:text-text-primary-dark">
              {isRegister ? "Create your account" : "Log in to EzConv Music"}
            </h1>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
              {isRegister
                ? "Start your music journey today"
                : "Welcome back to your music space"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Social Login */}
          <div className="flex flex-col items-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Login Failed")}
              theme={isDark ? "filled_black" : "outline"}
              shape="rectangular"
              width="320px"
            />
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-border-light dark:border-border-dark"></div>
            <span className="flex-shrink mx-4 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              OR
            </span>
            <div className="flex-grow border-t border-border-light dark:border-border-dark"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name..."
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-[#252525] border border-border-light dark:border-border-dark rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary-light dark:text-text-primary-dark"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                required
                className="w-full px-3 py-2 bg-white dark:bg-[#252525] border border-border-light dark:border-border-dark rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary-light dark:text-text-primary-dark"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password..."
                required
                minLength={6}
                className="w-full px-3 py-2 bg-white dark:bg-[#252525] border border-border-light dark:border-border-dark rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary-light dark:text-text-primary-dark"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-[#e8e8d0] text-gray-900 font-medium py-2 px-4 rounded text-sm transition-colors shadow-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </>
              ) : isRegister ? (
                "Create Account"
              ) : (
                "Continue"
              )}
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="mt-6 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-primary hover:underline font-medium"
            >
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-text-secondary-light dark:text-text-secondary-dark">
            By continuing, you acknowledge that you understand and agree to the{" "}
            <a
              href="#"
              className="underline hover:text-text-primary-light dark:hover:text-text-primary-dark"
            >
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline hover:text-text-primary-light dark:hover:text-text-primary-dark"
            >
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </main>
    </div>
  );
}
