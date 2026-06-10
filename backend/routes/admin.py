"""
Admin endpoint'leri — soru ve ders notu CRUD
GET/POST/PUT/DELETE /api/admin/questions
GET/POST/PUT/DELETE /api/admin/notes
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import json, os

from database import get_supabase

router = APIRouter()

ADMIN_EMAILS = ["zeynep.dilek.04@gmail.com"]

# ── Paths ─────────────────────────────────────────────────────────────────────
_BASE       = os.path.dirname(os.path.dirname(__file__))
_Q_PATH     = os.path.join(_BASE, "yeni_veritabani.json")
_N_PATH     = os.path.join(_BASE, "ders_notlari.json")

# ── Models ────────────────────────────────────────────────────────────────────
class QuestionIn(BaseModel):
    kategori:    str
    zorluk:      str
    soru:        str
    secenekler:  List[str]
    dogru_cevap: str

class NoteContentIn(BaseModel):
    baslik: str
    metin:  str

class NoteIn(BaseModel):
    ders_adi:  str
    icerikler: List[NoteContentIn]

# ── Admin auth helper ─────────────────────────────────────────────────────────
def check_admin(x_admin_email: Optional[str] = Header(None)):
    if x_admin_email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    return x_admin_email

# ── JSON helpers ──────────────────────────────────────────────────────────────
def load_questions():
    with open(_Q_PATH, encoding="utf-8") as f:
        return json.load(f)

def save_questions(data):
    with open(_Q_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_notes():
    with open(_N_PATH, encoding="utf-8") as f:
        return json.load(f)

def save_notes(data):
    with open(_N_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ════════════════════════════════════════════════════════════════════════════
# QUESTIONS
# ════════════════════════════════════════════════════════════════════════════

@router.get("/questions")
async def admin_list_questions(x_admin_email: str = Header(None)):
    check_admin(x_admin_email)
    questions = load_questions()
    # ID yoksa ekle
    for i, q in enumerate(questions):
        if "id" not in q:
            q["id"] = i + 1
    return {"questions": questions, "total": len(questions)}


@router.post("/questions")
async def admin_create_question(q: QuestionIn, x_admin_email: str = Header(None)):
    check_admin(x_admin_email)
    questions = load_questions()
    new_id = max((item.get("id", 0) for item in questions), default=0) + 1
    new_q = {
        "id":          new_id,
        "kategori":    q.kategori.upper(),
        "zorluk":      q.zorluk,
        "soru":        q.soru,
        "secenekler":  q.secenekler,
        "dogru_cevap": q.dogru_cevap.upper(),
    }
    questions.append(new_q)
    save_questions(questions)

    # Supabase'e de ekle
    try:
        db = get_supabase()
        db.table("questions").insert({
            "kategori":    new_q["kategori"],
            "zorluk":      new_q["zorluk"],
            "soru":        new_q["soru"],
            "secenekler":  new_q["secenekler"],
            "dogru_cevap": new_q["dogru_cevap"],
        }).execute()
    except Exception:
        pass

    return {"success": True, "question": new_q}


@router.put("/questions/{question_id}")
async def admin_update_question(question_id: int, q: QuestionIn, x_admin_email: str = Header(None)):
    check_admin(x_admin_email)
    questions = load_questions()
    for i, item in enumerate(questions):
        if item.get("id") == question_id:
            questions[i] = {
                "id":          question_id,
                "kategori":    q.kategori.upper(),
                "zorluk":      q.zorluk,
                "soru":        q.soru,
                "secenekler":  q.secenekler,
                "dogru_cevap": q.dogru_cevap.upper(),
            }
            save_questions(questions)
            try:
                db = get_supabase()
                db.table("questions").update({
                    "kategori":    q.kategori.upper(),
                    "zorluk":      q.zorluk,
                    "soru":        q.soru,
                    "secenekler":  q.secenekler,
                    "dogru_cevap": q.dogru_cevap.upper(),
                }).eq("id", question_id).execute()
            except Exception:
                pass
            return {"success": True, "question": questions[i]}
    raise HTTPException(status_code=404, detail="Soru bulunamadı")


@router.delete("/questions/{question_id}")
async def admin_delete_question(question_id: int, x_admin_email: str = Header(None)):
    check_admin(x_admin_email)
    questions = load_questions()
    new_list = [q for q in questions if q.get("id") != question_id]
    if len(new_list) == len(questions):
        raise HTTPException(status_code=404, detail="Soru bulunamadı")
    save_questions(new_list)
    try:
        db = get_supabase()
        db.table("questions").delete().eq("id", question_id).execute()
    except Exception:
        pass
    return {"success": True}

# ════════════════════════════════════════════════════════════════════════════
# NOTES — Supabase önce, JSON fallback
# ════════════════════════════════════════════════════════════════════════════

@router.get("/notes")
async def admin_list_notes(x_admin_email: str = Header(None)):
    check_admin(x_admin_email)
    try:
        db = get_supabase()
        result = db.table("ders_notlari").select("*").order("ders_adi").execute()
        if result.data is not None:
            return {"notes": result.data}
    except Exception:
        pass
    return {"notes": load_notes()}


@router.post("/notes")
async def admin_create_note(note: NoteIn, x_admin_email: str = Header(None)):
    check_admin(x_admin_email)
    icerikler = [{"baslik": c.baslik, "metin": c.metin} for c in note.icerikler]
    try:
        db = get_supabase()
        result = db.table("ders_notlari").insert({
            "ders_adi":  note.ders_adi,
            "icerikler": icerikler,
        }).execute()
        if result.data:
            # JSON'a da yaz (fallback için)
            _sync_notes_to_json()
            return {"success": True, "note": result.data[0]}
    except Exception as e:
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(status_code=400, detail="Bu ders adı zaten var")
        raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=500, detail="Eklenemedi")


@router.put("/notes/{ders_adi}")
async def admin_update_note(ders_adi: str, note: NoteIn, x_admin_email: str = Header(None)):
    check_admin(x_admin_email)
    icerikler = [{"baslik": c.baslik, "metin": c.metin} for c in note.icerikler]
    try:
        db = get_supabase()
        result = db.table("ders_notlari").update({
            "ders_adi":  note.ders_adi,
            "icerikler": icerikler,
        }).eq("ders_adi", ders_adi).execute()
        if result.data:
            _sync_notes_to_json()
            return {"success": True, "note": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Ders bulunamadı")


@router.delete("/notes/{ders_adi}")
async def admin_delete_note(ders_adi: str, x_admin_email: str = Header(None)):
    check_admin(x_admin_email)
    try:
        db = get_supabase()
        db.table("ders_notlari").delete().eq("ders_adi", ders_adi).execute()
        _sync_notes_to_json()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _sync_notes_to_json():
    """Supabase'deki notları JSON dosyasına yedekle."""
    try:
        db = get_supabase()
        result = db.table("ders_notlari").select("ders_adi, icerikler").order("ders_adi").execute()
        if result.data:
            save_notes(result.data)
    except Exception:
        pass
