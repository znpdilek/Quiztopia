import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "../utils/api.js";

const UserContext = createContext(null);

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Demo / guest user (auth olmadan lokal mod)
const DEMO_USER = {
  id:            "demo-user-001",
  username:      "Kahraman",
  email:         "demo@quiztopia.app",
  total_xp:      0,
  level:         "Çaylak",
  badges:        [],
  quiz_count:    0,
  correct_count: 0,
  streak:        0,
};

const AUTH_KEY = "quiztopia_auth";

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }) {
  const stored = loadStoredAuth();

  const [user, setUser]           = useState(stored?.user || DEMO_USER);
  const [authToken, setAuthToken] = useState(stored?.token || null);
  const [zenMode, setZenMode]     = useState(false);
  const [toasts, setToasts]       = useState([]);

  // Persist auth state
  useEffect(() => {
    if (authToken) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user, token: authToken }));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [authToken, user]);

  const addToast = useCallback((msg, type = "xp") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const updateUserXP = useCallback((xpEarned, newBadges, currentXP, currentLevel) => {
    setUser(prev => ({
      ...prev,
      total_xp:   currentXP,
      level:      currentLevel,
      quiz_count: prev.quiz_count + 1,
      badges:     [...prev.badges, ...newBadges],
    }));
    if (xpEarned > 0) addToast(`+${xpEarned} XP`, "xp");
    newBadges.forEach(b => addToast(`🏅 ${b}`, "badge"));
  }, [addToast]);

  const toggleZenMode = useCallback(() => setZenMode(p => !p), []);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.detail || "Giriş başarısız." };
      setUser(data.user);
      setAuthToken(data.token);
      return { success: true };
    } catch {
      // Backend yoksa lokal demo mod
      if (email && password.length >= 6) {
        const localUser = { ...DEMO_USER, email, username: email.split("@")[0] };
        setUser(localUser);
        setAuthToken("local-token");
        return { success: true };
      }
      return { error: "Sunucuya bağlanılamadı. Şifre en az 6 karakter olmalı." };
    }
  }, []);

  const register = useCallback(async (email, password, username) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password, username }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.detail || "Kayıt başarısız." };
      return { success: true };
    } catch {
      // Backend yoksa sadece doğrulama adımını simüle et
      return { success: true };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(DEMO_USER);
    setAuthToken(null);
  }, []);

  return (
    <UserContext.Provider value={{
      user, setUser,
      authToken,
      isAuthenticated: authToken !== null,
      login,
      register,
      logout,
      zenMode, toggleZenMode,
      toasts,
      updateUserXP,
      addToast,
    }}>
      {children}

      {/* Global Toast Layer */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-5 py-3 rounded-xl font-display font-bold text-sm animate-slide-up
              ${t.type === "xp"
                ? "bg-dark-700 border border-neon-cyan/50 text-neon-cyan shadow-neon"
                : "bg-dark-700 border border-neon-pink/50 text-neon-pink shadow-neon-pink"
              }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
