import { api } from "../utils/api.js";

const LEVEL_STYLES = {
  "Çaylak":      { gradient: "from-gray-600 to-gray-500",    glow: "shadow-gray-500/30",    text: "text-gray-300" },
  "Acemi":       { gradient: "from-green-700 to-green-500",  glow: "shadow-green-500/40",   text: "text-green-300" },
  "Orta Seviye": { gradient: "from-blue-700 to-blue-500",    glow: "shadow-blue-500/40",    text: "text-blue-300" },
  "Uzman":       { gradient: "from-purple-700 to-purple-500",glow: "shadow-purple-500/40",  text: "text-purple-300" },
  "Usta":        { gradient: "from-neon-pink to-pink-500",   glow: "shadow-neon-pink/40",   text: "text-pink-300" },
  "Efsane":      { gradient: "from-neon-cyan to-cyan-400",   glow: "shadow-neon/40",        text: "text-neon-cyan" },
};

export function XPDisplay({ xp, level, showBar = true, size = "md" }) {
  const progress = api.getLevelProgress(xp);
  const style    = LEVEL_STYLES[level] || LEVEL_STYLES["Çaylak"];

  const sizes = {
    sm: { text: "text-sm", xp: "text-xs", bar: "h-1.5" },
    md: { text: "text-base", xp: "text-sm", bar: "h-2" },
    lg: { text: "text-xl", xp: "text-base", bar: "h-3" },
  };
  const s = sizes[size];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={`font-display font-bold ${s.text} ${style.text}`}>
          {level}
        </span>
        <span className={`font-mono ${s.xp} text-white/50`}>
          {xp.toLocaleString()} XP
        </span>
      </div>
      {showBar && (
        <div className={`xp-bar-track ${s.bar}`}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${style.gradient} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

const BADGE_DEFS = {
  "ilk_cevap":   { icon: "🎯", label: "İlk Adım",                 desc: "İlk soruyu cevapladın!",                            color: "border-blue-500/40   bg-blue-500/10   text-blue-300" },
  "ilk_100":     { icon: "💯", label: "İlk 100",                  desc: "100 XP'ye ulaştın!",                                color: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300" },
  "hatasiz_5":   { icon: "🔥", label: "Hatasız Seri",             desc: "5 soruyu arka arkaya doğru yanıtladın!",             color: "border-orange-500/40 bg-orange-500/10 text-orange-300" },
  "hatasiz_10":  { icon: "🧠", label: "Demir Zihin",              desc: "10 soruyu arka arkaya doğru yanıtladın!",            color: "border-purple-500/40 bg-purple-500/10 text-purple-300" },
  "hiz_yildizi": { icon: "⚡", label: "Hız Yıldızı",              desc: "10 saniyenin altında doğru cevap verdin!",           color: "border-yellow-300/40 bg-yellow-300/10 text-yellow-200" },
  "sql_uzman":   { icon: "🗄️", label: "SQL Uzmanı",               desc: "SQL'de 20 soruyu doğru yanıtladın!",                color: "border-cyan-500/40   bg-cyan-500/10   text-cyan-300" },
  "bilgi_uzman": { icon: "🛡️", label: "Güvenlik Uzmanı",          desc: "Bilgi Güvenliği'nde 20 soruyu doğru yanıtladın!",   color: "border-green-500/40  bg-green-500/10  text-green-300" },
  "cpp_uzman":   { icon: "🖥️", label: "C++ Gurusu",               desc: "C++'da 20 soruyu doğru yanıtladın!",                color: "border-neon-cyan/40  bg-neon-cyan/10  text-neon-cyan" },
  "java_uzman":  { icon: "☕", label: "Java Ustası",               desc: "Java'da 20 soruyu doğru yanıtladın!",               color: "border-amber-500/40  bg-amber-500/10  text-amber-300" },
  "efsane":      { icon: "👑", label: "Efsane",                   desc: "3000 XP'ye ulaştın!",                               color: "border-neon-pink/50  bg-neon-pink/10  text-neon-pink" },
};

export function BadgeGrid({ badges, size = "md" }) {
  if (!badges?.length) return (
    <p className="text-white/30 text-sm font-body text-center py-6">
      Henüz rozet kazanılmadı. Test çözmeye başla!
    </p>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, i) => {
        const def = BADGE_DEFS[badge] || {
          icon: "⭐", label: badge, desc: "",
          color: "border-white/20 bg-white/5 text-white/60"
        };
        return (
          <div
            key={i}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border font-body
              font-medium transition-all duration-200 hover:scale-105 cursor-default ${def.color}`}
            title={def.desc || def.label}
          >
            <span className={size === "sm" ? "text-sm" : "text-base"}>{def.icon}</span>
            {size !== "sm" && (
              <span className="text-sm">{def.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StreakBadge({ streak }) {
  if (streak < 2) return null;
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                    bg-orange-500/10 border border-orange-500/30 text-orange-400
                    font-display font-bold text-xs animate-pulse-neon">
      🔥 {streak} Seri
    </div>
  );
}
