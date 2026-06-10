import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";
import {
  Plus, Pencil, Trash2, Save, X, ChevronDown, ChevronUp, BookOpen, Brain
} from "lucide-react";

const ADMIN_EMAILS = ["zeynep.dilek.04@gmail.com"];
const API = "http://localhost:8000/api/admin";
const CATEGORIES = ["PYTHON", "HTML", "C++", "CSHARP", "SQL", "JAVA", "BILGI", "PHP", "RUBY", "C", "CSS", "JAVASCRIPT", "GIT"];
const DIFFICULTIES = ["Kolay", "Orta", "Zor"];

function adminHeaders(email) {
  return { "Content-Type": "application/json", "x-admin-email": email };
}

// ── Shared components ─────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-display font-semibold transition-all
        ${active
          ? "bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan"
          : "text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent"}`}
    >
      <Icon size={15} />
      {label}
      {count != null && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-xs font-mono
          ${active ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/10 text-white/40"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-sm mx-4 p-6 space-y-5">
        <p className="text-white font-body text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost text-xs px-4 py-2">İptal</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30
                                                  text-red-400 hover:bg-red-500/30 text-xs font-display font-semibold transition-all">
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// QUESTIONS TAB
// ════════════════════════════════════════════════════════════════════════════
const EMPTY_Q = { kategori: "PYTHON", zorluk: "Kolay", soru: "", secenekler: ["", "", "", ""], dogru_cevap: "A" };

function QuestionForm({ initial, onSave, onCancel }) {
  const [form, setForm]         = useState(initial ?? { ...EMPTY_Q, secenekler: ["", "", "", ""] });
  const [customCat, setCustom]  = useState(false);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setOpt = (i, v) => {
    const next = [...form.secenekler];
    next[i] = v;
    setForm(p => ({ ...p, secenekler: next }));
  };

  const handleCatSelect = (e) => {
    if (e.target.value === "__new__") {
      setCustom(true);
      setField("kategori", "");
    } else {
      setField("kategori", e.target.value);
    }
  };

  const valid = form.soru.trim() && form.kategori.trim() && form.secenekler.every(s => s.trim());

  return (
    <div className="card p-6 space-y-4">
      {/* Kategori + Zorluk */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-mono text-white/40 uppercase tracking-widest">Kategori</label>
          {customCat ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={form.kategori}
                onChange={e => setField("kategori", e.target.value.toUpperCase())}
                placeholder="Yeni kategori adı..."
                className="flex-1 bg-dark-700 border border-neon-cyan/30 rounded-xl px-3 py-2 text-sm text-white font-body focus:border-neon-cyan/60 outline-none placeholder:text-white/20"
              />
              <button onClick={() => { setCustom(false); setField("kategori", CATEGORIES[0]); }}
                className="px-2 text-white/30 hover:text-white/60 text-xs">✕</button>
            </div>
          ) : (
            <select value={form.kategori} onChange={handleCatSelect}
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-body focus:border-neon-cyan/40 outline-none">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__new__">+ Yeni kategori ekle...</option>
            </select>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-mono text-white/40 uppercase tracking-widest">Zorluk</label>
          <select value={form.zorluk} onChange={e => setField("zorluk", e.target.value)}
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-body focus:border-neon-cyan/40 outline-none">
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Soru metni */}
      <div className="space-y-1">
        <label className="text-xs font-mono text-white/40 uppercase tracking-widest">Soru</label>
        <textarea
          rows={3}
          value={form.soru}
          onChange={e => setField("soru", e.target.value)}
          placeholder="Soru metnini girin..."
          className="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-body
                     focus:border-neon-cyan/40 outline-none resize-none placeholder:text-white/20"
        />
      </div>

      {/* Seçenekler */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-white/40 uppercase tracking-widest">Seçenekler</label>
        {["A", "B", "C", "D"].map((letter, i) => (
          <div key={letter} className="flex items-center gap-3">
            <span className="font-mono text-xs w-5 text-white/40">{letter}</span>
            <input
              value={form.secenekler[i] ?? ""}
              onChange={e => setOpt(i, e.target.value)}
              placeholder={`${letter} şıkkı...`}
              className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-body
                         focus:border-neon-cyan/40 outline-none placeholder:text-white/20"
            />
            <input
              type="radio"
              name="dogru"
              checked={form.dogru_cevap === letter}
              onChange={() => setField("dogru_cevap", letter)}
              className="accent-neon-cyan w-4 h-4"
              title="Doğru cevap"
            />
          </div>
        ))}
        <p className="text-xs text-white/30 font-body ml-8">Doğru cevap için radio butonunu işaretle</p>
      </div>

      {/* Butonlar */}
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="btn-ghost flex items-center gap-2 text-xs px-4 py-2">
          <X size={13} /> İptal
        </button>
        <button onClick={() => {
          const prefixes = ["a) ", "b) ", "c) ", "d) "];
          const normalized = {
            ...form,
            secenekler: form.secenekler.map((s, i) => {
              const clean = s.replace(/^[a-d]\)\s*/i, "");
              return prefixes[i] + clean;
            }),
          };
          onSave(normalized);
        }} disabled={!valid}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30
                     text-neon-cyan font-display font-semibold text-xs hover:bg-neon-cyan/20 transition-all
                     disabled:opacity-30 disabled:cursor-not-allowed">
          <Save size={13} /> Kaydet
        </button>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

function QuestionsTab({ email }) {
  const [questions,   setQuestions]  = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [backendDown, setBackendDown]= useState(false);
  const [filterCat,   setFilterCat]  = useState("ALL");
  const [filterDiff,  setFilterDiff] = useState("ALL");
  const [search,      setSearch]     = useState("");
  const [page,        setPage]       = useState(1);
  const [editingId,   setEditingId]  = useState(null);
  const [confirmDel,  setConfirmDel] = useState(null);
  const [err,         setErr]        = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setBackendDown(false);
    try {
      const r = await fetch(`${API}/questions`, { headers: adminHeaders(email) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = await r.json();
      setQuestions(d.questions || []);
    } catch {
      setBackendDown(true);
    } finally { setLoading(false); }
  }, [email]);

  useEffect(() => { load(); }, [load]);

  // Dinamik kategori listesi — yüklenen sorulardan çıkar
  const dynamicCats = useMemo(
    () => [...new Set(questions.map(q => q.kategori))].sort(),
    [questions]
  );

  const save = async (form, id) => {
    const url    = id ? `${API}/questions/${id}` : `${API}/questions`;
    const method = id ? "PUT" : "POST";
    const r = await fetch(url, { method, headers: adminHeaders(email), body: JSON.stringify(form) });
    if (!r.ok) { setErr("Kayıt başarısız."); return; }
    setEditingId(null);
    load();
  };

  const del = async (id) => {
    await fetch(`${API}/questions/${id}`, { method: "DELETE", headers: adminHeaders(email) });
    setConfirmDel(null);
    load();
  };

  const filtered = questions.filter(q =>
    (filterCat === "ALL"  || q.kategori === filterCat) &&
    (filterDiff === "ALL" || q.zorluk   === filterDiff) &&
    (!search || q.soru.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // filtre değişince sayfa sıfırla
  useEffect(() => setPage(1), [filterCat, filterDiff, search]);

  return (
    <div className="space-y-5">

      {/* Backend down uyarısı */}
      {backendDown && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-body text-red-400 flex items-center justify-between gap-4">
          <span>⚠️ Backend'e bağlanılamadı. Backend'in çalıştığından emin ol: <code className="font-mono text-xs">uvicorn main:app --reload</code></span>
          <button onClick={load} className="text-xs font-display font-semibold text-red-400 hover:text-red-300 underline shrink-0">Tekrar dene</button>
        </div>
      )}

      {err && <div className="text-red-400 text-sm font-mono">{err}</div>}

      {/* Arama + Filtreler + Ekle butonu */}
      <div className="space-y-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Soru metniyle ara..."
          className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-body
                     focus:border-neon-cyan/40 outline-none placeholder:text-white/20"
        />
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-body focus:border-neon-cyan/40 outline-none">
              <option value="ALL">Tüm Kategoriler</option>
              {dynamicCats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
              className="bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-body focus:border-neon-cyan/40 outline-none">
              <option value="ALL">Tüm Zorluklar</option>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span className="flex items-center text-xs font-mono text-white/30 px-2">
              {filtered.length} soru
            </span>
          </div>
          <button onClick={() => setEditingId("new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30
                       text-neon-cyan text-xs font-display font-semibold hover:bg-neon-cyan/20 transition-all">
            <Plus size={13} /> Yeni Soru
          </button>
        </div>
      </div>

      {/* Yeni soru formu */}
      {editingId === "new" && (
        <QuestionForm onSave={(form) => save(form, null)} onCancel={() => setEditingId(null)} />
      )}

      {/* Soru listesi */}
      {loading ? (
        <div className="text-center py-10 text-neon-cyan font-mono animate-pulse">Yükleniyor...</div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map(q => (
              <div key={q.id}>
                {editingId === q.id ? (
                  <QuestionForm
                    initial={{ kategori: q.kategori, zorluk: q.zorluk, soru: q.soru,
                               secenekler: Array.isArray(q.secenekler) ? q.secenekler : [], dogru_cevap: q.dogru_cevap }}
                    onSave={(form) => save(form, q.id)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="card p-4 flex items-start gap-4 group">
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border
                          ${q.zorluk === "Kolay" ? "border-neon-green/30 text-neon-green bg-neon-green/5"
                            : q.zorluk === "Orta" ? "border-yellow-400/30 text-yellow-400 bg-yellow-400/5"
                            : "border-red-400/30 text-red-400 bg-red-400/5"}`}>
                          {q.zorluk}
                        </span>
                        <span className="text-[10px] font-mono text-neon-cyan/60 bg-neon-cyan/5 px-2 py-0.5 rounded-md border border-neon-cyan/15">
                          {q.kategori}
                        </span>
                      </div>
                      <p className="text-sm font-body text-white/80 leading-snug truncate">{q.soru}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => setEditingId(q.id)}
                        className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center
                                   text-white/40 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirmDel(q)}
                        className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center
                                   text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-white/20 font-mono text-sm">Soru bulunamadı.</div>
            )}
          </div>

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-white/40 text-xs font-mono
                           hover:border-white/20 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all
                    ${p === safePage
                      ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan"
                      : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-white/40 text-xs font-mono
                           hover:border-white/20 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                →
              </button>
            </div>
          )}
        </>
      )}

      {confirmDel && (
        <ConfirmModal
          message={`"${confirmDel.soru.slice(0, 80)}…" sorusunu silmek istediğine emin misin?`}
          onConfirm={() => del(confirmDel.id)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NOTES TAB
// ════════════════════════════════════════════════════════════════════════════
const EMPTY_NOTE = { ders_adi: "", icerikler: [{ baslik: "", metin: "" }] };

function NoteForm({ initial, originalDersAdi, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial ? JSON.parse(JSON.stringify(initial)) : { ...EMPTY_NOTE, icerikler: [{ baslik: "", metin: "" }] }
  );

  const setName = (v) => setForm(p => ({ ...p, ders_adi: v }));
  const setIcerik = (i, k, v) => {
    const next = [...form.icerikler];
    next[i] = { ...next[i], [k]: v };
    setForm(p => ({ ...p, icerikler: next }));
  };
  const addIcerik = () => setForm(p => ({ ...p, icerikler: [...p.icerikler, { baslik: "", metin: "" }] }));
  const removeIcerik = (i) => setForm(p => ({ ...p, icerikler: p.icerikler.filter((_, j) => j !== i) }));

  const valid = form.ders_adi.trim() && form.icerikler.every(ic => ic.baslik.trim() && ic.metin.trim());

  return (
    <div className="card p-6 space-y-5">
      <div className="space-y-1">
        <label className="text-xs font-mono text-white/40 uppercase tracking-widest">Ders Adı</label>
        <input
          value={form.ders_adi}
          onChange={e => setName(e.target.value)}
          placeholder="Örn: Python"
          className="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-body
                     focus:border-neon-cyan/40 outline-none placeholder:text-white/20"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono text-white/40 uppercase tracking-widest">İçerikler</label>
          <button onClick={addIcerik}
            className="flex items-center gap-1 text-xs text-neon-cyan/70 hover:text-neon-cyan transition-colors">
            <Plus size={12} /> Bölüm Ekle
          </button>
        </div>

        {form.icerikler.map((ic, i) => (
          <div key={i} className="bg-dark-700/50 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white/30">Bölüm {i + 1}</span>
              {form.icerikler.length > 1 && (
                <button onClick={() => removeIcerik(i)}
                  className="text-white/20 hover:text-red-400 transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>
            <input
              value={ic.baslik}
              onChange={e => setIcerik(i, "baslik", e.target.value)}
              placeholder="Başlık..."
              className="w-full bg-dark-800/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-body
                         focus:border-neon-cyan/40 outline-none placeholder:text-white/20"
            />
            <textarea
              rows={4}
              value={ic.metin}
              onChange={e => setIcerik(i, "metin", e.target.value)}
              placeholder="İçerik metni..."
              className="w-full bg-dark-800/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-body
                         focus:border-neon-cyan/40 outline-none resize-none placeholder:text-white/20"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="btn-ghost flex items-center gap-2 text-xs px-4 py-2">
          <X size={13} /> İptal
        </button>
        <button onClick={() => onSave(form, originalDersAdi)} disabled={!valid}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30
                     text-neon-cyan font-display font-semibold text-xs hover:bg-neon-cyan/20 transition-all
                     disabled:opacity-30 disabled:cursor-not-allowed">
          <Save size={13} /> Kaydet
        </button>
      </div>
    </div>
  );
}

function NotesTab({ email }) {
  const [notes, setNotes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingDers, setEditing] = useState(null); // null | "new" | ders_adi string
  const [expandedDers, setExpand] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);
  const [err, setErr]             = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/notes`, { headers: adminHeaders(email) });
      const d = await r.json();
      setNotes(d.notes || []);
    } catch { setErr("Notlar yüklenemedi."); }
    finally { setLoading(false); }
  }, [email]);

  useEffect(() => { load(); }, [load]);

  const save = async (form, originalDersAdi) => {
    const isNew = !originalDersAdi;
    const url   = isNew ? `${API}/notes` : `${API}/notes/${encodeURIComponent(originalDersAdi)}`;
    const method = isNew ? "POST" : "PUT";
    const r = await fetch(url, { method, headers: adminHeaders(email), body: JSON.stringify(form) });
    if (!r.ok) { const d = await r.json(); setErr(d.detail || "Kayıt başarısız."); return; }
    setEditing(null);
    load();
  };

  const del = async (ders_adi) => {
    await fetch(`${API}/notes/${encodeURIComponent(ders_adi)}`, { method: "DELETE", headers: adminHeaders(email) });
    setConfirmDel(null);
    load();
  };

  const toggleExpand = (name) => setExpand(p => ({ ...p, [name]: !p[name] }));

  return (
    <div className="space-y-5">
      {err && <div className="text-red-400 text-sm font-mono">{err}</div>}

      <div className="flex justify-end">
        <button onClick={() => setEditing("new")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30
                     text-neon-cyan text-xs font-display font-semibold hover:bg-neon-cyan/20 transition-all">
          <Plus size={13} /> Yeni Ders
        </button>
      </div>

      {editingDers === "new" && (
        <NoteForm onSave={(form) => save(form, null)} onCancel={() => setEditing(null)} />
      )}

      {loading ? (
        <div className="text-center py-10 text-neon-cyan font-mono animate-pulse">Yükleniyor...</div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.ders_adi}>
              {editingDers === note.ders_adi ? (
                <NoteForm
                  initial={note}
                  originalDersAdi={note.ders_adi}
                  onSave={save}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="card border border-white/5 overflow-hidden">
                  <div className="flex items-center gap-3 p-4 group">
                    <button onClick={() => toggleExpand(note.ders_adi)} className="flex-1 flex items-center gap-3 text-left">
                      <BookOpen size={15} className="text-neon-cyan/60 shrink-0" />
                      <span className="font-display font-semibold text-sm text-white/80">{note.ders_adi}</span>
                      <span className="text-xs font-mono text-white/30 ml-1">({note.icerikler?.length ?? 0} bölüm)</span>
                      {expandedDers[note.ders_adi]
                        ? <ChevronUp size={13} className="text-white/30 ml-auto" />
                        : <ChevronDown size={13} className="text-white/30 ml-auto" />}
                    </button>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => setEditing(note.ders_adi)}
                        className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center
                                   text-white/40 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setConfirmDel(note)}
                        className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center
                                   text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {expandedDers[note.ders_adi] && (
                    <div className="border-t border-white/5 px-4 py-3 space-y-3">
                      {note.icerikler?.map((ic, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-xs font-display font-semibold text-neon-cyan/70">{ic.baslik}</p>
                          <p className="text-xs font-body text-white/40 leading-relaxed whitespace-pre-wrap line-clamp-3">{ic.metin}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {notes.length === 0 && !loading && (
            <div className="text-center py-10 text-white/20 font-mono text-sm">Henüz ders notu yok.</div>
          )}
        </div>
      )}

      {confirmDel && (
        <ConfirmModal
          message={`"${confirmDel.ders_adi}" dersini silmek istediğine emin misin?`}
          onConfirm={() => del(confirmDel.ders_adi)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const { user, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState("questions");

  const isAdmin = isAuthenticated && ADMIN_EMAILS.includes(user?.email);

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
        <p className="font-display font-black text-2xl text-white/60">Giriş gerekli</p>
        <button onClick={() => navigate("/login")} className="btn-primary">Giriş Yap</button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
        <p className="font-display font-black text-2xl text-red-400">Erişim Reddedildi</p>
        <p className="text-white/40 font-body text-sm">Bu sayfa yalnızca admin kullanıcıya özeldir.</p>
        <button onClick={() => navigate("/")} className="btn-ghost">Ana Sayfa</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="font-display font-black text-4xl neon-text">Admin Paneli</h1>
        <p className="text-white/40 font-body mt-2 text-sm">İçerik yönetimi — soru ve ders notları</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <TabBtn active={tab === "questions"} onClick={() => setTab("questions")} icon={Brain} label="Sorular" />
        <TabBtn active={tab === "notes"}     onClick={() => setTab("notes")}     icon={BookOpen} label="Ders Notları" />
      </div>

      {/* Content */}
      {tab === "questions" && <QuestionsTab email={user.email} />}
      {tab === "notes"     && <NotesTab     email={user.email} />}
    </div>
  );
}
