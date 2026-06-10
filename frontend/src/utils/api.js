import quizData    from "../data/quiz_data.json";
import dersNotlari from "../data/ders_notlari.json";
import { supabase } from "../lib/supabase.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ── Fetch wrapper ────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API unreachable (${path}), using local fallback:`, err.message);
    return null;
  }
}

// ── XP / badge calculation (mirrors backend logic) ───────────────────────────
const XP_MAP   = { Kolay: 10, Orta: 20, Zor: 35 };
const LEVELS   = [
  [0,    "Çaylak"],
  [100,  "Acemi"],
  [300,  "Orta Seviye"],
  [700,  "Uzman"],
  [1500, "Usta"],
  [3000, "Efsane"],
];

function getLevel(xp) {
  let level = LEVELS[0][1];
  for (const [thresh, name] of LEVELS) {
    if (xp >= thresh) level = name;
  }
  return level;
}

function getLevelProgress(xp) {
  for (let i = 0; i < LEVELS.length - 1; i++) {
    const [lo] = LEVELS[i], [hi] = LEVELS[i + 1];
    if (xp >= lo && xp < hi) return (xp - lo) / (hi - lo);
  }
  return 1;
}

function normalizeAnswer(ans) {
  return String(ans).trim().toUpperCase().replace(/[).]/g, "");
}

// ── Local question store ──────────────────────────────────────────────────────
const LOCAL_QUESTIONS = quizData.map((q, i) => ({ ...q, id: i + 1 }));

let localUserState = {
  total_xp:    0,
  quiz_count:  0,
  correct_count: 0,
  streak:      0,
  badges:      [],
  category_correct: {},
};

function checkBadgesLocal(state, category, time_spent = 99) {
  const earned = [];
  const { total_xp, quiz_count, correct_count, streak, badges } = state;

  const award = (id, name) => {
    if (!badges.includes(id)) { badges.push(id); earned.push(name); }
  };

  if (quiz_count === 1)        award("ilk_cevap",   "İlk Adım 🎯");
  if (total_xp >= 100)         award("ilk_100",     "İlk 100 💯");
  if (streak >= 5)             award("hatasiz_5",   "Hatasız Seri 🔥");
  if (streak >= 10)            award("hatasiz_10",  "Demir Zihin 🧠");
  if (total_xp >= 3000)        award("efsane",      "Efsane 👑");
  if (time_spent < 10)         award("hiz_yildizi", "Hız Yıldızı ⚡");

  const catCorrect = state.category_correct[category] || 0;
  if (catCorrect >= 20) {
    const catMap = { SQL:"sql_uzman", BILGI:"bilgi_uzman", "C++":"cpp_uzman", JAVA:"java_uzman" };
    const icons  = { SQL:"🗄️", BILGI:"🛡️", "C++":"⚡", JAVA:"☕" };
    if (catMap[category]) award(catMap[category], `${category} Uzmanı ${icons[category] || "⭐"}`);
  }

  return earned;
}

// ── Public API ───────────────────────────────────────────────────────────────
export const api = {
  // ── Questions ──
  async getQuestions({ kategori, zorluk, limit = 20, shuffle = true } = {}) {
    const remote = await request(
      `/quizzes/?${new URLSearchParams({ ...(kategori && { kategori }), ...(zorluk && { zorluk }), limit, shuffle }).toString()}`
    );
    if (remote) return remote.questions;

    // local fallback
    let q = [...LOCAL_QUESTIONS];
    if (kategori) q = q.filter(x => x.kategori.toUpperCase() === kategori.toUpperCase());
    if (zorluk)   q = q.filter(x => x.zorluk === zorluk);
    if (shuffle)  q.sort(() => Math.random() - 0.5);
    return q.slice(0, limit);
  },

  async getCategories() {
    const remote = await request("/quizzes/categories");
    if (remote) return remote.categories;
    return [...new Set(LOCAL_QUESTIONS.map(q => q.kategori))].sort();
  },

  // ── Submit Answer ──
  async submitAnswer({ user_id, question_id, answer, time_spent = 0, question }) {
    // Always try remote first
    const remote = await request("/quizzes/submit", {
      method: "POST",
      body: JSON.stringify({ user_id, question_id, answer, time_spent }),
    });
    if (remote) return remote;

    // Local simulation
    const isCorrect = normalizeAnswer(question.dogru_cevap) === normalizeAnswer(answer);
    const xpBase    = isCorrect ? XP_MAP[question.zorluk] || 10 : 0;
    const speedBonus = isCorrect && time_spent < 10 ? 5 : 0;

    localUserState.quiz_count++;
    if (isCorrect) {
      localUserState.streak++;
      localUserState.correct_count++;
      localUserState.category_correct[question.kategori] =
        (localUserState.category_correct[question.kategori] || 0) + 1;
    } else {
      localUserState.streak = 0;
    }

    const streakBonus = (isCorrect && localUserState.streak > 0 && localUserState.streak % 5 === 0) ? 15 : 0;
    const xpEarned    = xpBase + speedBonus + streakBonus;
    localUserState.total_xp += xpEarned;

    const badges = checkBadgesLocal(localUserState, question.kategori, time_spent);

    return {
      correct:        isCorrect,
      correct_answer: question.dogru_cevap,
      xp_earned:      xpEarned,
      badges_earned:  badges,
      current_xp:     localUserState.total_xp,
      current_level:  getLevel(localUserState.total_xp),
    };
  },

  // ── Notes ──
  async getNotes() {
    const remote = await request("/notes/");
    if (remote) return remote.dersler;
    return dersNotlari.map(d => ({ ders_adi: d.ders_adi, konu_sayisi: d.icerikler.length }));
  },

  async getNote(dersAdi) {
    const remote = await request(`/notes/${encodeURIComponent(dersAdi)}`);
    if (remote) return remote;
    return dersNotlari.find(
      d => d.ders_adi.toLowerCase().replace(/\s/g, "") === dersAdi.toLowerCase().replace(/\s/g, "")
    );
  },

  // ── Leaderboard ──
  async getLeaderboard(period = "alltime") {
    const { data, error } = await supabase
      .rpc("get_leaderboard", { period });

    if (error || !data?.length) {
      // RPC yoksa eski yönteme düş (sadece alltime)
      const { data: fallback } = await supabase
        .from("users")
        .select("username, total_xp, level, badges")
        .order("total_xp", { ascending: false })
        .limit(20);
      if (!fallback?.length) return [];
      return fallback.map((row, i) => ({
        rank:     i + 1,
        username: row.username || "Anonim",
        xp:       row.total_xp || 0,
        level:    row.level    || getLevel(row.total_xp || 0),
        badges:   row.badges   || [],
      }));
    }

    return data.map((row, i) => ({
      rank:     i + 1,
      username: row.username || "Anonim",
      xp:       Number(row.xp) || 0,
      level:    row.level    || getLevel(Number(row.xp) || 0),
      badges:   row.badges   || [],
    }));
  },

  // ── User Stats ──
  async getUserStats(userId) {
    const remote = await request(`/users/${userId}/stats`);
    if (remote) return remote;

    const s = localUserState;
    const breakdown = {};
    Object.keys(s.category_correct).forEach(cat => {
      breakdown[cat] = {
        correct: s.category_correct[cat],
        total:   s.category_correct[cat] + Math.floor(Math.random() * 3),
        pct:     Math.round((s.category_correct[cat] / (s.category_correct[cat] + 2)) * 100),
      };
    });

    return {
      total_xp:        s.total_xp,
      current_level:   getLevel(s.total_xp),
      level_progress:  getLevelProgress(s.total_xp),
      quiz_count:      s.quiz_count,
      correct_count:   s.correct_count,
      accuracy:        s.quiz_count ? Math.round((s.correct_count / s.quiz_count) * 100) : 0,
      topic_breakdown: breakdown,
      recent_badges:   s.badges.slice(-5),
    };
  },

  getLevel,
  getLevelProgress,
};
