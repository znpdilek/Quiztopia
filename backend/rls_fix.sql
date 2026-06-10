-- ============================================================
-- RLS Düzeltmeleri — Supabase SQL Editor'da çalıştır
-- ============================================================

-- ── USERS tablosu ────────────────────────────────────────────

-- Mevcut "for all" policy'yi kaldır (çok kısıtlayıcı, leaderboard'u kırar)
drop policy if exists "users_own_data" on public.users;

-- Herkes kullanıcı profillerini okuyabilir (liderboard için şart)
create policy "users_public_read" on public.users
  for select using (true);

-- Kullanıcı sadece kendi satırını güncelleyebilir
create policy "users_own_update" on public.users
  for update using (auth.uid()::text = id);

-- Kullanıcı sadece kendi satırını silebilir
create policy "users_own_delete" on public.users
  for delete using (auth.uid()::text = id);

-- Yeni kayıt: kullanıcı sadece kendi id'siyle insert yapabilir
create policy "users_own_insert" on public.users
  for insert with check (auth.uid()::text = id);


-- ── QUESTIONS tablosu ────────────────────────────────────────

-- Herkes soruları okuyabilir (zaten var ama emin olmak için)
drop policy if exists "questions_public_read" on public.questions;
create policy "questions_public_read" on public.questions
  for select using (true);

-- Sadece servis role (backend) insert/update/delete yapabilir
-- Frontend'den doğrudan yazma engellenir
-- (Admin panel backend üzerinden çalıştığı için bu yeterli)


-- ── TEST_HISTORY tablosu ─────────────────────────────────────

-- Kullanıcı sadece kendi geçmişini okuyabilir/yazabilir (zaten var)
-- Leaderboard RPC SECURITY DEFINER ile bypass eder
drop policy if exists "history_own" on public.test_history;
create policy "history_own_select" on public.test_history
  for select using (auth.uid()::text = user_id);
create policy "history_own_insert" on public.test_history
  for insert with check (auth.uid()::text = user_id);
create policy "history_own_delete" on public.test_history
  for delete using (auth.uid()::text = user_id);


-- ── USER_ACHIEVEMENTS tablosu ────────────────────────────────

drop policy if exists "achievements_own" on public.user_achievements;
create policy "achievements_own_select" on public.user_achievements
  for select using (auth.uid()::text = user_id);
create policy "achievements_own_insert" on public.user_achievements
  for insert with check (auth.uid()::text = user_id);


-- ── RLS aktif olduğunu doğrula ───────────────────────────────
-- Bu sorgu her tablonun RLS durumunu gösterir:
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('users','questions','test_history','user_achievements');
