"""
Ders notları endpoint'leri — Supabase önce, JSON fallback
GET /api/notes/           → tüm dersler
GET /api/notes/{ders_adi} → tek ders içerikleri
"""

from fastapi import APIRouter, HTTPException
import json, os

from database import get_supabase

router = APIRouter()

_NOTES_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ders_notlari.json")

def _load_json_fallback():
    try:
        with open(_NOTES_PATH, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


@router.get("/")
async def get_all_notes():
    try:
        db = get_supabase()
        result = db.table("ders_notlari").select("ders_adi, icerikler").order("ders_adi").execute()
        if result.data:
            return {
                "dersler": [
                    {"ders_adi": d["ders_adi"], "konu_sayisi": len(d["icerikler"] or [])}
                    for d in result.data
                ]
            }
    except Exception:
        pass

    # JSON fallback
    data = _load_json_fallback()
    return {
        "dersler": [
            {"ders_adi": d["ders_adi"], "konu_sayisi": len(d["icerikler"])}
            for d in data
        ]
    }


@router.get("/{ders_adi}")
async def get_note(ders_adi: str):
    try:
        db = get_supabase()
        result = db.table("ders_notlari").select("*").execute()
        if result.data:
            for d in result.data:
                if d["ders_adi"].lower().replace(" ", "") == ders_adi.lower().replace(" ", ""):
                    return d
            raise HTTPException(status_code=404, detail=f"'{ders_adi}' dersi bulunamadı")
    except HTTPException:
        raise
    except Exception:
        pass

    # JSON fallback
    data = _load_json_fallback()
    for ders in data:
        if ders["ders_adi"].lower().replace(" ", "") == ders_adi.lower().replace(" ", ""):
            return ders
    raise HTTPException(status_code=404, detail=f"'{ders_adi}' dersi bulunamadı")
