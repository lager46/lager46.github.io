-- MotoAuction final integration migration. Run once in Supabase SQL Editor.
-- Do not put service_role/sb_secret keys in client code.

create extension if not exists pgcrypto;

alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.motorcycles add column if not exists title text;
alter table public.motorcycles add column if not exists end_date timestamptz;
alter table public.motorcycles add column if not exists rejection_reason text;
alter table public.motorcycles add column if not exists updated_at timestamptz not null default now();
alter table public.complaints add column if not exists reason text;
alter table public.complaints add column if not exists details text;
alter table public.complaints add column if not exists status text not null default 'open';
alter table public.complaints add column if not exists resolved_at timestamptz;
alter table public.complaints add column if not exists created_at timestamptz not null default now();
alter table public.sales add column if not exists created_at timestamptz not null default now();

-- Older project schemas sometimes used the misspelling `reeson`; preserve existing data.
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='complaints' and column_name='reeson') then
    execute 'update public.complaints set reason = coalesce(reason, reeson::text) where reason is null';
  end if;
end $$;

update public.motorcycles set title = trim(concat_ws(' ', brand, model)) where title is null or btrim(title) = '';
delete from public.sales a using public.sales b where a.motorcycle_id=b.motorcycle_id and a.id < b.id;
create unique index if not exists sales_motorcycle_id_unique on public.sales(motorcycle_id);
create index if not exists motorcycles_status_created_idx on public.motorcycles(status, created_at desc);
create index if not exists bids_motorcycle_amount_idx on public.bids(motorcycle_id, amount desc);
create index if not exists complaints_status_created_idx on public.complaints(status, created_at desc);

create or replace function public.is_moto_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and coalesce(p.is_blocked,false) = false); $$;
revoke all on function public.is_moto_admin() from public;
grant execute on function public.is_moto_admin() to anon, authenticated;

create or replace function public.is_moto_user_active()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id=auth.uid() and coalesce(p.is_blocked,false)=false); $$;
revoke all on function public.is_moto_user_active() from public;
grant execute on function public.is_moto_user_active() to authenticated;

-- Ensure RLS is active and remove policies created by earlier stages that may be too broad.
alter table public.profiles enable row level security;
alter table public.motorcycles enable row level security;
alter table public.bids enable row level security;
alter table public.sales enable row level security;
alter table public.complaints enable row level security;

-- Remove legacy permissive policies from earlier setup stages before installing the final set.
do $$ declare pol record; begin
  for pol in select schemaname, tablename, policyname from pg_policies
    where schemaname='public' and tablename in ('profiles','motorcycles','bids','sales','complaints')
  loop execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename); end loop;
end $$;

drop policy if exists ma_profiles_select_own on public.profiles;
drop policy if exists ma_profiles_update_own on public.profiles;
drop policy if exists ma_profiles_admin_select on public.profiles;
create policy ma_profiles_select_own on public.profiles for select to authenticated using (id = auth.uid() or public.is_moto_admin());
create policy ma_profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy ma_profiles_admin_select on public.profiles for select to authenticated using (public.is_moto_admin());
-- Prevent self-promotion by editing role/is_blocked through the Data API.
revoke update on public.profiles from anon, authenticated;
grant update (username, full_name, avatar_url) on public.profiles to authenticated;

drop policy if exists ma_motorcycles_select_visible on public.motorcycles;
drop policy if exists ma_motorcycles_insert_own_pending on public.motorcycles;
drop policy if exists ma_motorcycles_update_own_pending on public.motorcycles;
drop policy if exists ma_motorcycles_admin_all on public.motorcycles;
create policy ma_motorcycles_select_visible on public.motorcycles for select to anon, authenticated using (status in ('active','sold') or user_id = auth.uid() or public.is_moto_admin());
create policy ma_motorcycles_insert_own_pending on public.motorcycles for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and public.is_moto_user_active());
create policy ma_motorcycles_update_own_pending on public.motorcycles for update to authenticated using (user_id = auth.uid() and status = 'pending') with check (user_id = auth.uid() and status = 'pending' and public.is_moto_user_active());
create policy ma_motorcycles_admin_all on public.motorcycles for all to authenticated using (public.is_moto_admin()) with check (public.is_moto_admin());

drop policy if exists ma_bids_select_own on public.bids;
drop policy if exists ma_bids_select_admin on public.bids;
drop policy if exists ma_bids_insert_own on public.bids;
create policy ma_bids_select_own on public.bids for select to authenticated using (user_id = auth.uid() or public.is_moto_admin());
-- Direct client inserts remain disallowed; place_bid is the only intended bid writer.
revoke insert, update, delete on public.bids from anon, authenticated;

drop policy if exists ma_sales_select_related on public.sales;
drop policy if exists ma_sales_admin_all on public.sales;
create policy ma_sales_select_related on public.sales for select to authenticated using (seller_id = auth.uid() or buyer_id = auth.uid() or public.is_moto_admin());
create policy ma_sales_admin_all on public.sales for all to authenticated using (public.is_moto_admin()) with check (public.is_moto_admin());
revoke insert, update, delete on public.sales from anon, authenticated;

drop policy if exists ma_complaints_insert_own on public.complaints;
drop policy if exists ma_complaints_select_own_admin on public.complaints;
drop policy if exists ma_complaints_admin_update on public.complaints;
create policy ma_complaints_insert_own on public.complaints for insert to authenticated with check (user_id = auth.uid() and public.is_moto_user_active());
create policy ma_complaints_select_own_admin on public.complaints for select to authenticated using (user_id = auth.uid() or public.is_moto_admin());
create policy ma_complaints_admin_update on public.complaints for update to authenticated using (public.is_moto_admin()) with check (public.is_moto_admin());

-- New signup profile. Existing trigger is replaced by a stable upsert handler.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, role, is_blocked)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), 'user', false)
  on conflict (id) do update set username = coalesce(excluded.username, public.profiles.username), full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Backfill profiles for accounts that existed before the profile trigger was installed.
insert into public.profiles (id, username, full_name, role, is_blocked)
select u.id, coalesce(u.raw_user_meta_data->>'username', split_part(u.email,'@',1)), coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'username', split_part(u.email,'@',1)), 'user', false
from auth.users u on conflict (id) do nothing;


-- Recreate bid RPC with row locking, ownership/status checks and blocked-account protection.
drop function if exists public.place_bid(bigint, numeric);
create function public.place_bid(p_motorcycle_id bigint, p_amount numeric)
returns bigint language plpgsql security definer set search_path = public
as $$
declare v_user_id uuid := auth.uid(); v_lot public.motorcycles%rowtype; v_bid_id bigint;
begin
  if v_user_id is null then raise exception 'Для ставки войдите в аккаунт'; end if;
  if not public.is_moto_user_active() then raise exception 'Учётная запись заблокирована или профиль не найден'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Сумма ставки должна быть положительной'; end if;
  select * into v_lot from public.motorcycles where id=p_motorcycle_id for update;
  if not found then raise exception 'Лот не найден'; end if;
  if v_lot.status <> 'active' then raise exception 'Лот не принимает ставки'; end if;
  if v_lot.end_date is not null and v_lot.end_date <= now() then raise exception 'Время аукциона истекло'; end if;
  if v_lot.user_id = v_user_id then raise exception 'Нельзя делать ставку на собственный лот'; end if;
  if p_amount <= coalesce(v_lot.current_price, v_lot.starting_price, 0) then raise exception 'Ставка должна быть выше текущей цены'; end if;
  insert into public.bids (motorcycle_id, user_id, amount) values (p_motorcycle_id, v_user_id, p_amount) returning id into v_bid_id;
  update public.motorcycles set current_price=p_amount, updated_at=now() where id=p_motorcycle_id;
  return v_bid_id;
end; $$;
revoke all on function public.place_bid(bigint,numeric) from public;
grant execute on function public.place_bid(bigint,numeric) to authenticated;

create or replace function public.admin_set_lot_status(p_lot_id bigint, p_status text, p_reason text default null)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_moto_admin() then raise exception 'Доступ запрещён: нужны права администратора'; end if;
  if p_status not in ('active','rejected','pending') then raise exception 'Недопустимый статус лота'; end if;
  update public.motorcycles set status=p_status, rejection_reason=case when p_status='rejected' then coalesce(nullif(btrim(p_reason),''),'Причина не указана') else null end, updated_at=now()
  where id=p_lot_id;
  if not found then raise exception 'Лот не найден'; end if;
end; $$;

create or replace function public.admin_delete_lot(p_lot_id bigint)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_moto_admin() then raise exception 'Доступ запрещён: нужны права администратора'; end if;
  update public.motorcycles set status='rejected', rejection_reason='Скрыто администратором', updated_at=now() where id=p_lot_id;
  if not found then raise exception 'Лот не найден'; end if;
end; $$;

create or replace function public.admin_resolve_complaint(p_complaint_id bigint)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_moto_admin() then raise exception 'Доступ запрещён: нужны права администратора'; end if;
  update public.complaints set status='resolved', resolved_at=now() where id=p_complaint_id;
  if not found then raise exception 'Жалоба не найдена'; end if;
end; $$;

create or replace function public.admin_list_users()
returns table(id uuid, username text, email text, phone text, role text, is_blocked boolean, created_at timestamptz)
language plpgsql security definer set search_path = public, auth
as $$
begin
  if not public.is_moto_admin() then raise exception 'Доступ запрещён: нужны права администратора'; end if;
  return query select p.id, coalesce(p.username, u.email), u.email::text, coalesce(u.raw_user_meta_data->>'phone',''), p.role, coalesce(p.is_blocked,false), p.created_at
  from public.profiles p join auth.users u on u.id=p.id order by p.created_at desc;
end; $$;

create or replace function public.admin_set_user_blocked(p_user_id uuid, p_blocked boolean)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_moto_admin() then raise exception 'Доступ запрещён: нужны права администратора'; end if;
  if p_user_id = auth.uid() then raise exception 'Нельзя блокировать собственную учётную запись'; end if;
  update public.profiles set is_blocked=p_blocked where id=p_user_id and role <> 'admin';
  if not found then raise exception 'Пользователь не найден или является администратором'; end if;
end; $$;

-- Finalize an expired auction exactly once. This is not a payment processor.
create or replace function public.finalize_expired_auction(p_lot_id bigint)
returns void language plpgsql security definer set search_path = public
as $$
declare m public.motorcycles%rowtype; b public.bids%rowtype;
begin
  select * into m from public.motorcycles where id=p_lot_id for update;
  if not found then raise exception 'Лот не найден'; end if;
  if m.status <> 'active' or m.end_date is null or m.end_date > now() then raise exception 'Аукцион ещё не завершён'; end if;
  select * into b from public.bids where motorcycle_id=p_lot_id order by amount desc, created_at asc limit 1;
  if b.id is null then update public.motorcycles set status='ended', updated_at=now() where id=p_lot_id; return; end if;
  insert into public.sales (motorcycle_id, seller_id, buyer_id, final_price, created_at)
  values (m.id, m.user_id, b.user_id, b.amount, now()) on conflict (motorcycle_id) do nothing;
  update public.motorcycles set status='sold', current_price=b.amount, updated_at=now() where id=p_lot_id;
end; $$;

revoke all on function public.admin_set_lot_status(bigint,text,text) from public;
revoke all on function public.admin_delete_lot(bigint) from public;
revoke all on function public.admin_resolve_complaint(bigint) from public;
revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_set_user_blocked(uuid,boolean) from public;
revoke all on function public.finalize_expired_auction(bigint) from public;
grant execute on function public.admin_set_lot_status(bigint,text,text) to authenticated;
grant execute on function public.admin_delete_lot(bigint) to authenticated;
grant execute on function public.admin_resolve_complaint(bigint) to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_user_blocked(uuid,boolean) to authenticated;
grant execute on function public.finalize_expired_auction(bigint) to anon, authenticated;

-- Storage bucket and safe public read / owner upload policies.
insert into storage.buckets (id, name, public) values ('motorcycle-images','motorcycle-images',true) on conflict (id) do update set public=true;
drop policy if exists moto_images_public_read on storage.objects;
drop policy if exists moto_images_owner_insert on storage.objects;
drop policy if exists moto_images_owner_delete on storage.objects;
create policy moto_images_public_read on storage.objects for select to anon, authenticated using (bucket_id='motorcycle-images');
create policy moto_images_owner_insert on storage.objects for insert to authenticated with check (bucket_id='motorcycle-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy moto_images_owner_delete on storage.objects for delete to authenticated using (bucket_id='motorcycle-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Public sales feed exposes only listing details, not buyer/seller UUIDs.
create or replace view public.public_sales as
select s.id, s.motorcycle_id, m.title, m.brand, m.model, m.year, m.image_url,
       s.final_price, s.created_at
from public.sales s join public.motorcycles m on m.id=s.motorcycle_id;
grant select on public.public_sales to anon, authenticated;

-- Aggregate-only public counters for the landing page (no personal data).
create or replace view public.public_site_stats as
select
  (select count(*) from public.motorcycles where status in ('active','sold'))::bigint as total_lots,
  (select count(*) from public.profiles)::bigint as registered_users,
  coalesce((select sum(final_price) from public.sales),0)::numeric as total_sales_volume,
  (select count(*) from public.sales)::bigint as total_sales;
grant select on public.public_site_stats to anon, authenticated;
