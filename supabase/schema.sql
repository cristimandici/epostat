-- ============================================================
-- EPOSTAT.RO - Schema bază de date Supabase
-- Rulează acest fișier în Supabase → SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extensie a auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  avatar_url text,
  phone text,
  city text,
  rating numeric(3,2) default 5.0,
  review_count int default 0,
  ads_count int default 0,
  verified boolean default false,
  member_since timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles sunt publice" on public.profiles
  for select using (true);

create policy "Utilizatorul isi modifica propriul profil" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile la sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id text primary key,
  name text not null,
  icon text not null,
  color text not null,
  sort_order int default 0
);

alter table public.categories enable row level security;
create policy "Categories sunt publice" on public.categories for select using (true);

insert into public.categories (id, name, icon, color, sort_order) values
  ('electronice', 'Electronice', '📱', 'blue', 1),
  ('auto', 'Auto / Moto', '🚗', 'red', 2),
  ('imobiliare', 'Imobiliare', '🏠', 'green', 3),
  ('moda', 'Modă & Accesorii', '👗', 'pink', 4),
  ('casa', 'Casă & Grădină', '🛋️', 'orange', 5),
  ('sport', 'Sport & Timp liber', '⚽', 'emerald', 6),
  ('copii', 'Copii & Jucării', '🧸', 'yellow', 7),
  ('servicii', 'Servicii', '🔧', 'purple', 8),
  ('animale', 'Animale', '🐾', 'amber', 9),
  ('altele', 'Altele', '📦', 'gray', 10);

-- ============================================================
-- ADS
-- ============================================================
create table public.ads (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  price numeric(12,2) not null,
  negotiable boolean default false,
  category_id text references public.categories(id),
  subcategory text,
  condition text not null check (condition in ('nou', 'ca-nou', 'buna-stare', 'uzura-normala', 'necesita-reparatii')),
  images text[] default '{}',
  location text,
  city text,
  status text not null default 'activ' check (status in ('activ', 'vandut', 'expirat', 'draft')),
  views int default 0,
  favorites_count int default 0,
  urgent boolean default false,
  specs jsonb default '{}',
  seller_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '60 days')
);

alter table public.ads enable row level security;

create policy "Anunturi active sunt publice" on public.ads
  for select using (status = 'activ' or seller_id = auth.uid());

create policy "Utilizatorul isi creeaza anunturi" on public.ads
  for insert with check (auth.uid() = seller_id);

create policy "Utilizatorul isi modifica anunturile" on public.ads
  for update using (auth.uid() = seller_id);

create policy "Utilizatorul isi sterge anunturile" on public.ads
  for delete using (auth.uid() = seller_id);

-- Index pentru căutare și filtrare
create index ads_category_idx on public.ads(category_id);
create index ads_city_idx on public.ads(city);
create index ads_status_idx on public.ads(status);
create index ads_seller_idx on public.ads(seller_id);
create index ads_created_idx on public.ads(created_at desc);

-- Full-text search
alter table public.ads add column search_vector tsvector
  generated always as (to_tsvector('romanian', title || ' ' || description)) stored;
create index ads_search_idx on public.ads using gin(search_vector);

-- ============================================================
-- FAVORITES
-- ============================================================
create table public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  ad_id uuid references public.ads(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, ad_id)
);

alter table public.favorites enable row level security;

create policy "Utilizatorul isi vede favoritele" on public.favorites
  for select using (auth.uid() = user_id);

create policy "Utilizatorul adauga favorite" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "Utilizatorul sterge favorite" on public.favorites
  for delete using (auth.uid() = user_id);

-- Update favorites_count la add/remove
create or replace function update_favorites_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.ads set favorites_count = favorites_count + 1 where id = new.ad_id;
  elsif tg_op = 'DELETE' then
    update public.ads set favorites_count = favorites_count - 1 where id = old.ad_id;
  end if;
  return null;
end;
$$;

create trigger on_favorite_change
  after insert or delete on public.favorites
  for each row execute procedure update_favorites_count();

-- ============================================================
-- OFFERS
-- ============================================================
create table public.offers (
  id uuid default uuid_generate_v4() primary key,
  ad_id uuid references public.ads(id) on delete cascade not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  current_amount numeric(12,2) not null,
  original_price numeric(12,2) not null,
  status text not null default 'asteptare' check (status in ('asteptare', 'acceptata', 'refuzata', 'contraoferta')),
  message text,
  expires_at timestamptz default (now() + interval '48 hours'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.offers enable row level security;

create policy "Vanzatorul si cumparatorul vad oferta" on public.offers
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Cumparatorul face oferta" on public.offers
  for insert with check (auth.uid() = buyer_id);

create policy "Partile pot actualiza oferta" on public.offers
  for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

create table public.offer_events (
  id uuid default uuid_generate_v4() primary key,
  offer_id uuid references public.offers(id) on delete cascade not null,
  type text not null check (type in ('oferta', 'contraoferta', 'acceptata', 'refuzata')),
  amount numeric(12,2),
  message text,
  by_user text not null check (by_user in ('buyer', 'seller')),
  created_at timestamptz default now()
);

alter table public.offer_events enable row level security;

create policy "Partile vad evenimentele" on public.offer_events
  for select using (
    exists (
      select 1 from public.offers o
      where o.id = offer_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

create policy "Partile adauga evenimente" on public.offer_events
  for insert with check (
    exists (
      select 1 from public.offers o
      where o.id = offer_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  ad_id uuid references public.ads(id) on delete set null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  last_message text,
  last_message_at timestamptz default now(),
  buyer_unread int default 0,
  seller_unread int default 0,
  created_at timestamptz default now(),
  unique(ad_id, buyer_id, seller_id)
);

alter table public.conversations enable row level security;

create policy "Participantii vad conversatia" on public.conversations
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Cumparatorul creeaza conversatia" on public.conversations
  for insert with check (auth.uid() = buyer_id);

create policy "Participantii actualizeaza conversatia" on public.conversations
  for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  from_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Participantii vad mesajele" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "Participantii trimit mesaje" on public.messages
  for insert with check (
    auth.uid() = from_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- Update conversation la mesaj nou
create or replace function update_conversation_on_message()
returns trigger language plpgsql as $$
declare
  conv record;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  update public.conversations set
    last_message = new.text,
    last_message_at = new.created_at,
    buyer_unread = case when new.from_id != buyer_id then buyer_unread + 1 else buyer_unread end,
    seller_unread = case when new.from_id != seller_id then seller_unread + 1 else seller_unread end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_insert
  after insert on public.messages
  for each row execute procedure update_conversation_on_message();

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewed_id uuid references public.profiles(id) on delete cascade not null,
  ad_id uuid references public.ads(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(reviewer_id, ad_id)
);

alter table public.reviews enable row level security;

create policy "Recenziile sunt publice" on public.reviews for select using (true);

create policy "Utilizatorul scrie recenzie" on public.reviews
  for insert with check (auth.uid() = reviewer_id);

-- Update rating la review nou
create or replace function update_profile_rating()
returns trigger language plpgsql as $$
begin
  update public.profiles set
    rating = (select avg(rating) from public.reviews where reviewed_id = new.reviewed_id),
    review_count = (select count(*) from public.reviews where reviewed_id = new.reviewed_id)
  where id = new.reviewed_id;
  return new;
end;
$$;

create trigger on_review_insert
  after insert on public.reviews
  for each row execute procedure update_profile_rating();

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values ('ad-images', 'ad-images', true);

create policy "Imaginile sunt publice" on storage.objects
  for select using (bucket_id = 'ad-images');

create policy "Utilizatorul incarca imagini" on storage.objects
  for insert with check (bucket_id = 'ad-images' and auth.uid() is not null);

create policy "Utilizatorul sterge propriile imagini" on storage.objects
  for delete using (bucket_id = 'ad-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- VIEWS utile
-- ============================================================
create or replace view public.ads_with_seller as
select
  a.*,
  p.name as seller_name,
  p.avatar_url as seller_avatar,
  p.rating as seller_rating,
  p.review_count as seller_review_count,
  p.verified as seller_verified,
  p.phone as seller_phone
from public.ads a
join public.profiles p on p.id = a.seller_id;
