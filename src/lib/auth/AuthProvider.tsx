import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { usePlaybackStore } from "../stores/playbackStore";

// Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  api: AxiosInstance;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constants - use Vite proxy in dev, full URL in production
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

// AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isRefreshing = useRef(false);
  const refreshSubscribers = useRef<((token: string) => void)[]>([]);

  // Create axios instance
  const api = React.useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, // Important: send cookies
      }),
    [],
  );

  // Subscribe to token refresh
  const subscribeTokenRefresh = (callback: (token: string) => void) => {
    refreshSubscribers.current.push(callback);
  };

  // Notify all subscribers with new token
  const onTokenRefreshed = (token: string) => {
    refreshSubscribers.current.forEach((callback) => callback(token));
    refreshSubscribers.current = [];
  };

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (isRefreshing.current) {
      // Wait for ongoing refresh
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          resolve(token);
        });
      });
    }

    isRefreshing.current = true;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const { accessToken: newToken, user: newUser } = response.data;
      setAccessToken(newToken);
      setUser(newUser);

      onTokenRefreshed(newToken);
      return newToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      setAccessToken(null);
      setUser(null);
      clearPlayback();
      return null;
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  // Axios request interceptor - add access token
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [accessToken, api]);

  // Axios response interceptor - handle 401 and refresh
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If 401 and not already retried
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          const newToken = await refreshToken();

          if (newToken) {
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } else {
            // Refresh failed, redirect to login
            window.location.href = "/login";
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [api, refreshToken]);

  // Initial auth check on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      // Try to refresh token (silently login)
      await refreshToken();
      setIsLoading(false);
    };

    initAuth();
  }, [refreshToken]);

  const queryClient = useQueryClient();
  const clearPlayback = usePlaybackStore((state) => state.clearPlayback);

  // Login
  const login = async (email: string, password: string) => {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      { email, password },
      { withCredentials: true },
    );

    const { accessToken: token, user: loggedInUser } = response.data;
    setAccessToken(token);
    setUser(loggedInUser);
    queryClient.clear(); // Clear any stale data from previous attempts
    clearPlayback(); // Reset player state for new user
  };

  // Register
  const register = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    const response = await axios.post(
      `${API_BASE_URL}/auth/register`,
      { email, password, displayName },
      { withCredentials: true },
    );

    const { accessToken: token, user: registeredUser } = response.data;
    setAccessToken(token);
    setUser(registeredUser);
    queryClient.clear();
    clearPlayback();
  };

  // Logout
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAccessToken(null);
      setUser(null);
      clearPlayback(); // Reset player state
      queryClient.clear(); // CRITICAL: Clear cache so next user doesn't see old data
    }
  };

  // Logout from all devices
  const logoutAll = async () => {
    try {
      await api.post("/auth/logout-all");
    } catch (error) {
      console.error("Logout all error:", error);
    } finally {
      setAccessToken(null);
      setUser(null);
      clearPlayback(); // Reset player state
      queryClient.clear(); // CRITICAL: Clear cache
    }
  };

  // Google Login
  const loginWithGoogle = async (idToken: string) => {
    const response = await axios.post(
      `${API_BASE_URL}/auth/google-login`,
      { idToken },
      { withCredentials: true },
    );

    const { accessToken: token, user: loggedInUser } = response.data;
    setAccessToken(token);
    setUser(loggedInUser);
    queryClient.clear();
    clearPlayback();
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!accessToken && !!user,
    isLoading,
    login,
    register,
    loginWithGoogle,
    logout,
    logoutAll,
    refreshToken,
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
