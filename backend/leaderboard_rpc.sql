-- Supabase SQL Editor'da çalıştır
-- Haftalık / Aylık / Tüm zamanlar liderboard RPC

create or replace function get_leaderboard(period text default 'alltime')
returns table (
  username  text,
  xp        bigint,
  level     text,
  badges    text[]
)
language sql
security definer   -- RLS'yi bypass eder, sadece bu fonksiyon için
set search_path = public
as $$
  select
    u.username,
    case
      when period = 'alltime' then u.total_xp::bigint
      when period = 'weekly'  then coalesce(
        (select sum(h.xp_earned)
         from public.test_history h
         where h.user_id = u.id
           and h.created_at >= now() - interval '7 days'), 0)::bigint
      when period = 'monthly' then coalesce(
        (select sum(h.xp_earned)
         from public.test_history h
         where h.user_id = u.id
           and h.created_at >= now() - interval '30 days'), 0)::bigint
      else u.total_xp::bigint
    end as xp,
    u.level,
    u.badges
  from public.users u
  order by xp desc
  limit 20;
$$;

-- Herkesin çağırabilmesi için izin ver
grant execute on function get_leaderboard(text) to anon, authenticated;
