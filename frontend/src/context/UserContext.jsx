import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const UserContext = createContext(null);

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

  useEffect(() => {
    if (authToken) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user, token: authToken }));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [authToken, user]);

  const addToast = useCallback((msg, type = "xp") => {
  const id = Date.now() + Math.random(); // çakışan id'leri önle
  setToasts(prev => [...prev, { id, msg, type }]);
  setTimeout(() => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, 3000);
}, []);

  const updateUserXP = useCallback((xpEarned, newBadges, currentXP, currentLevel) => {
    setUser(prev => ({
      ...prev,
      total_xp:      currentXP,      // backend'den gelen kesin değer
      level:         currentLevel,   // backend'den gelen kesin seviye
      quiz_count:    prev.quiz_count + 1,
      correct_count: xpEarned > 0 ? prev.correct_count + 1 : prev.correct_count,
      badges:        [...new Set([...prev.badges, ...newBadges])],
    }));
    if (xpEarned > 0) addToast(`+${xpEarned} XP`, "xp");
    newBadges.forEach(b => addToast(`🏅 ${b}`, "badge"));
  }, [addToast]);

  const toggleZenMode = useCallback(() => setZenMode(p => !p), []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    setUser({
      ...DEMO_USER,
      id:       data.user.id,
      email:    data.user.email,
      username: data.user.user_metadata?.username || data.user.email.split("@")[0],
    });
    setAuthToken(data.session.access_token);
    return { success: true };
  }, []);

  const register = useCallback(async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { error: error.message };

    if (data?.user) {
    await supabase.from("users").insert({
      id:       data.user.id.toString(),
      email:    email,
      username: username,
      total_xp: 0,
      level:    "Çaylak",
      badges:   [],
    });
   }

    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
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