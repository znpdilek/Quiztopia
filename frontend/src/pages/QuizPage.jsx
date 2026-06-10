import { useState }       from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RotateCcw, ChevronDown, ChevronUp, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import QuizConfig         from "../components/QuizConfig.jsx";
import ZenMode            from "../components/ZenMode.jsx";
import { XPDisplay }      from "../components/XPBadge.jsx";
import { useQuiz }        from "../hooks/useQuiz.js";
import { useUser }        from "../context/UserContext.jsx";

const LETTER_MAP = { A: 0, B: 1, C: 2, D: 3 };

function AnswerReview({ history }) {
  const [showAll, setShowAll]   = useState(false);
  const [expanded, setExpanded] = useState({});

  const wrongOnes = history.filter(h => !h.correct);
  const displayed = showAll ? history : wrongOnes;

  if (history.length === 0) return null;

  const toggle = (i) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 text-left">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-display font-semibold tracking-widest text-white/40 uppercase">
          Soru Incelemesi
        </p>
        <button
          onClick={() => setShowAll(p => !p)}
          className="text-xs font-mono text-neon-cyan/70 hover:text-neon-cyan transition-colors"
        >
          {showAll
            ? "Sadece yanlışlar (" + wrongOnes.length + ")"
            : "Tümünü göster (" + history.length + ")"}
        </button>
      </div>

      {displayed.length === 0 && (
        <div className="card p-4 text-center text-neon-green font-mono text-sm">
          Hic yanlış yapmadın!
        </div>
      )}

      {displayed.map((item, i) => {
        const idx        = showAll ? i : history.indexOf(item);
        const isOpen     = expanded[idx];
        const userIdx    = LETTER_MAP[item.userAnswer];
        const correctIdx = LETTER_MAP[item.correctAnswer];

        return (
          <div
            key={idx}
            className={"card border transition-colors " + (item.correct ? "border-neon-green/15" : "border-red-500/20")}
          >
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-start gap-3 p-4 text-left"
            >
              {item.correct
                ? <CheckCircle size={16} className="text-neon-green mt-0.5 shrink-0" />
                : <XCircle     size={16} className="text-red-400 mt-0.5 shrink-0" />
              }
              <span className="text-sm font-body text-white/80 flex-1 leading-snug">
                {item.question.soru}
              </span>
              {isOpen
                ? <ChevronUp   size={14} className="text-white/30 shrink-0 mt-0.5" />
                : <ChevronDown size={14} className="text-white/30 shrink-0 mt-0.5" />
              }
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-1.5 border-t border-white/5 pt-3">
                {item.question.secenekler && item.question.secenekler.map((opt, oi) => {
                  const letter    = ["A", "B", "C", "D"][oi];
                  const isCorrect = oi === correctIdx;
                  const isUser    = oi === userIdx;
                  let cls = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body ";
                  if (isCorrect) {
                    cls += "bg-neon-green/10 border border-neon-green/30 text-neon-green";
                  } else if (isUser && !item.correct) {
                    cls += "bg-red-500/10 border border-red-500/30 text-red-400";
                  } else {
                    cls += "text-white/40";
                  }
                  return (
                    <div key={oi} className={cls}>
                      <span className="font-mono text-xs w-4 shrink-0">{letter}</span>
                      <span>{opt.replace(/^[a-d]\)\s*/i, "")}</span>
                      {isCorrect && <span className="ml-auto text-xs font-mono">Dogru</span>}
                      {isUser && !item.correct && <span className="ml-auto text-xs font-mono">Senin cevabın</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuizResult({ score, total, xpGained, history, isAuthenticated, onRegister, onRestart, onRetryWrong, onDashboard }) {
  const pct   = total ? Math.round((score / total) * 100) : 0;
  const grade =
    pct >= 90 ? "Mukemmel! 🏆" :
    pct >= 70 ? "Harika! 🔥"   :
    pct >= 50 ? "Iyi! 👍"      : "Tekrar dene! 💪";

  return (
    <div className="max-w-2xl mx-auto text-center py-12 space-y-8 animate-pop px-6">
      <div className="font-display font-black text-7xl neon-text">{pct}%</div>
      <div>
        <p className="text-2xl font-display font-bold text-white">{grade}</p>
        <p className="text-white/50 font-mono mt-2">{score} / {total} dogru</p>
        {xpGained > 0 && (
          <p className="text-neon-cyan font-display font-bold text-lg mt-3">
            +{xpGained} XP kazandın!
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={onRestart} className="btn-primary flex items-center gap-2">
          <RotateCcw size={16} /> Tekrar
        </button>
        {history.filter(h => !h.correct).length > 0 && (
          <button onClick={onRetryWrong} className="btn-ghost flex items-center gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
            <RefreshCw size={16} /> Yanlışları Tekrar Çöz ({history.filter(h => !h.correct).length})
          </button>
        )}
        <button onClick={onDashboard} className="btn-ghost">Dashboard</button>
      </div>

      {!isAuthenticated && (
        <div className="w-full max-w-2xl mx-auto p-5 rounded-2xl bg-gradient-to-br
                        from-neon-cyan/8 to-neon-pink/5 border border-neon-cyan/20 space-y-3">
          <p className="font-display font-bold text-white text-sm">
            İlerlemenin kaybolmasın! 🚀
          </p>
          <p className="text-white/50 font-body text-xs leading-relaxed">
            Misafir olarak oynadığın için bu sonuç kaydedilmedi. Kayıt ol, XP kazan ve liderlik tablosuna çık.
          </p>
          <button
            onClick={onRegister}
            className="w-full py-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30
                       text-neon-cyan font-display font-bold text-sm tracking-wider
                       hover:bg-neon-cyan/20 transition-all duration-200"
          >
            Ücretsiz Kayıt Ol →
          </button>
        </div>
      )}

      <AnswerReview history={history} />
    </div>
  );
}

function GuestBanner({ onLogin, onRegister }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 rounded-xl
                    bg-neon-cyan/5 border border-neon-cyan/15 text-sm">
      <p className="text-white/50 font-body">
        <span className="text-neon-cyan font-semibold">Misafir modundasın</span> — XP ve ilerleme kaydedilmiyor.
      </p>
      <div className="flex gap-2 shrink-0">
        <button onClick={onLogin}
          className="px-3 py-1.5 rounded-lg border border-white/20 text-white/60
                     hover:border-neon-cyan/40 hover:text-white text-xs font-display font-semibold transition-all">
          Giriş Yap
        </button>
        <button onClick={onRegister}
          className="px-3 py-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan
                     hover:bg-neon-cyan/20 text-xs font-display font-semibold transition-all">
          Kayıt Ol
        </button>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const presetCat = location.state?.kategori ?? null;
  const { user, zenMode, toggleZenMode, isAuthenticated } = useUser();

  const {
    phase, currentQuestion, currentIdx, totalQuestions,
    selectedAnswer, answered, result, streak, sessionXP,
    score, loading, timeLeft, history,
    startQuiz, retryWrong, submitAnswer, nextQuestion, resetQuiz,
  } = useQuiz();

  const handleStart = async (config) => {
    await startQuiz(config);
    if (!zenMode) toggleZenMode();
  };

  const handleNext = () => {
    const isLast = currentIdx + 1 >= totalQuestions;
    nextQuestion();
    if (isLast && zenMode) toggleZenMode();
  };

  const handleExit = () => {
    if (zenMode) toggleZenMode();
    resetQuiz();
  };

  if (zenMode && phase === "quiz" && currentQuestion) {
    return (
      <ZenMode
        question={currentQuestion}
        questionIndex={currentIdx}
        totalQuestions={totalQuestions}
        timeLeft={timeLeft}
        selectedAnswer={selectedAnswer}
        answered={answered}
        onSelectAnswer={submitAnswer}
        onNext={handleNext}
        onExit={handleExit}
        result={result}
        streak={streak}
      />
    );
  }

  if (phase === "config") {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8 animate-slide-up">
        {!isAuthenticated && (
          <GuestBanner
            onLogin={() => navigate("/login")}
            onRegister={() => navigate("/register")}
          />
        )}
        <div>
          <h1 className="font-display font-black text-4xl neon-text">Quiz</h1>
          <p className="text-white/40 font-body mt-2">Kategori ve zorluk sec, Zen Modda basla.</p>
        </div>
        <div className="card p-8">
          {loading ? (
            <div className="text-center py-10 text-neon-cyan font-mono animate-pulse">
              Sorular yükleniyor...
            </div>
          ) : (
            <QuizConfig onStart={handleStart} presetKategori={presetCat} />
          )}
        </div>
        <div className="card p-6">
          <XPDisplay xp={user.total_xp} level={user.level} />
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <QuizResult
        score={score}
        total={totalQuestions}
        xpGained={sessionXP}
        history={history}
        isAuthenticated={isAuthenticated}
        onRegister={() => navigate("/register")}
        onRestart={resetQuiz}
        onRetryWrong={() => {
          const wrongQs = history.filter(h => !h.correct).map(h => h.question);
          retryWrong(wrongQs);
          if (!zenMode) toggleZenMode();
        }}
        onDashboard={() => navigate("/dashboard")}
      />
    );
  }

  return null;
}
