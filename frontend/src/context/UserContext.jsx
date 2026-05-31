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

// public.users tablosundan gerçek profili çek
async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data;
}

// public.users'da yoksa oluştur (mail onayı sonrası için)
async function syncUserProfile(supabaseUser) {
  const profile = await fetchUserProfile(supabaseUser.id);
  if (profile) return profile;

  // Profil yoksa oluştur
  const username =
    supabaseUser.user_metadata?.username ||
    supabaseUser.email.split("@")[0];

  const { data, error } = await supabase.from("users").insert({
    id:            supabaseUser.id,
    email:         supabaseUser.email,
    username:      username,
    total_xp:      0,
    level:         "Çaylak",
    badges:        [],
    quiz_count:    0,
    correct_count: 0,
    streak:        0,
  }).select().single();

  if (error) {
    console.error("Profil oluşturulamadı:", error.message);
    // Insert başarısız olsa bile tekrar dene (trigger zaten eklediyse conflict olur)
    return await fetchUserProfile(supabaseUser.id);
  }
  return data;
}

export function UserProvider({ children }) {
  const stored = loadStoredAuth();

  const [user, setUser]           = useState(stored?.user || DEMO_USER);
  const [authToken, setAuthToken] = useState(stored?.token || null);
  const [zenMode, setZenMode]     = useState(false);
  const [toasts, setToasts]       = useState([]);

  // ── Supabase oturum değişikliklerini dinle ──────────────────────────────
  // Bu sayede mail onayı sonrası, sekme yenilemede, token süresinde
  // gerçek DB verisi her zaman çekilir — localStorage'daki eski/sıfır veri kullanılmaz
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // Her girişte DB'den gerçek profili çek
          const profile = await syncUserProfile(session.user);
          if (profile) {
            setUser(profile);
            setAuthToken(session.access_token);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(DEMO_USER);
          setAuthToken(null);
        } else if (event === "TOKEN_REFRESHED" && session) {
          // Token yenilendi, sadece token'ı güncelle
          setAuthToken(session.access_token);
        }
      }
    );

    // Sayfa açılışında mevcut oturum varsa kontrol et
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await syncUserProfile(session.user);
        if (profile) {
          setUser(profile);
          setAuthToken(session.access_token);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── localStorage sync ───────────────────────────────────────────────────
  useEffect(() => {
    if (authToken) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user, token: authToken }));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [authToken, user]);

  const addToast = useCallback((msg, type = "xp") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const updateUserXP = useCallback((xpEarned, newBadges, currentXP, currentLevel) => {
    setUser(prev => ({
      ...prev,
      total_xp:      currentXP,
      level:         currentLevel,
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
    // Profil onAuthStateChange ile otomatik çekilecek, burada setUser gerekmez
    return { success: true };
  }, []);

  const register = useCallback(async (email, password, username) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { error: error.message };

    // public.users'a insert ETME — Supabase trigger halleder.
    // Mail onayı öncesi insert yapmak RLS hatası verir.

    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // onAuthStateChange SIGNED_OUT eventi setUser(DEMO_USER) yapacak
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