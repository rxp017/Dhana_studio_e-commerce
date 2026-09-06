-- ============ DHANA STUDIO — run this once on a fresh project ============
create extension if not exists pgcrypto;

-- 1. PROFILES (one row per user)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

-- 2. PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  category text not null check (category in ('tshirt','saree')),
  price integer not null check (price > 0),
  mrp integer,
  images jsonb not null default '[]'::jsonb,
  sizes text[] default '{}',
  stock integer not null default 50,
  is_new boolean not null default false,
  is_active boolean not null default true,
  rating numeric(2,1) not null default 4.5,
  rating_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index products_cat_idx on public.products (category);
create index products_new_idx on public.products (created_at desc);

-- 3. ORDERS (items are snapshotted as jsonb — price locked at order time)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  status text not null default 'pending'
    check (status in ('pending','paid','confirmed','shipped','delivered','cancelled','failed')),
  payment_method text not null default 'online',
  items jsonb not null default '[]'::jsonb,
  address jsonb not null default '{}'::jsonb,
  subtotal integer not null default 0,
  shipping integer not null default 0,
  total integer not null default 0,
  razorpay_order_id text unique,
  razorpay_payment_id text,
  created_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);

-- 4. NEWSLETTER
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$   select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
 $$;

-- Helper: decrement stock (called by the payment API)
create or replace function public.decrement_stock(p_product uuid, p_qty int)
returns void language sql security definer set search_path = public as $$   update public.products set stock = greatest(stock - p_qty, 0) where id = p_product;
 $$;

-- Auto-create a profile whenever someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$ begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name',
             split_part(coalesce(new.email, ''), '@', 1)),
    new.phone
  );
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ SECURITY (RLS) ============
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.subscribers enable row level security;

drop policy if exists "read own or admin" on public.profiles;
create policy "read own or admin" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "update own" on public.profiles;
create policy "update own" on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "read products" on public.products;
create policy "read products" on public.products for select
  using (is_active = true or public.is_admin());

drop policy if exists "admin insert" on public.products;
create policy "admin insert" on public.products for insert with check (public.is_admin());

drop policy if exists "admin update" on public.products;
create policy "admin update" on public.products for update using (public.is_admin());

drop policy if exists "admin delete" on public.products;
create policy "admin delete" on public.products for delete using (public.is_admin());

-- Orders are written only by the server (service role); users read their own.
drop policy if exists "read own orders" on public.orders;
create policy "read own orders" on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "anyone subscribes" on public.subscribers;
create policy "anyone subscribes" on public.subscribers for insert with check (true);

-- ============ IMAGE STORAGE (public bucket for product photos) ============
insert into storage.buckets (id, name, public) values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "public read products" on storage.objects;
create policy "public read products" on storage.objects for select
  using (bucket_id = 'products');

drop policy if exists "admin upload products" on storage.objects;
create policy "admin upload products" on storage.objects for insert
  with check (bucket_id = 'products' and public.is_admin());

-- ============ DEMO PRODUCTS (replace with your real assets) ============
insert into public.products
  (name, description, category, price, mrp, images, sizes, stock, is_new, rating, rating_count, created_at) values
('Kaavi Block-Print Tee', 'Our signature vermillion block print on 240 GSM combed cotton. Pre-shrunk, breathable, and printed to survive 50+ washes. Round neck, regular fit.', 'tshirt', 599, 1099, '["https://picsum.photos/seed/dhana-tee1/900/1200","https://picsum.photos/seed/dhana-tee1b/900/1200"]', '{S,M,L,XL,XXL}', 42, true, 4.7, 231, now() - interval '1 hour'),
('Indigo Dip-Dye Oversized Tee', 'Hand dip-dyed in natural indigo tones, then hi-def printed. 240 GSM heavyweight cotton in a relaxed oversized drop-shoulder cut. No two pieces are identical.', 'tshirt', 749, 1299, '["https://picsum.photos/seed/dhana-tee2/900/1200","https://picsum.photos/seed/dhana-tee2b/900/1200"]', '{S,M,L,XL,XXL}', 36, true, 4.6, 189, now() - interval '5 hours'),
('Kalamkari Story Tee', 'A hand-drawn Kalamkari panel printed across the chest. Heavyweight cotton, side-seamed, with a enzyme-washed finish for that lived-in feel.', 'tshirt', 699, 1199, '["https://picsum.photos/seed/dhana-tee3/900/1200","https://picsum.photos/seed/dhana-tee3b/900/1200"]', '{S,M,L,XL,XXL}', 6, true, 4.8, 96, now() - interval '2 days'),
('Marigold Graphic Tee', 'Bold marigold typography print inspired by Indian street signage. 220 GSM ring-spun cotton, tagless neck label.', 'tshirt', 549, 999, '["https://picsum.photos/seed/dhana-tee4/900/1200","https://picsum.photos/seed/dhana-tee4b/900/1200"]', '{S,M,L,XL,XXL}', 64, false, 4.5, 412, now() - interval '9 days'),
('Inkdrift Heavyweight Tee', 'An abstract ink-flow print designed in-studio. The heaviest tee we make — 260 GSM — cut boxy with double-stitched hems.', 'tshirt', 899, 1499, '["https://picsum.photos/seed/dhana-tee5/900/1200","https://picsum.photos/seed/dhana-tee5b/900/1200"]', '{S,M,L,XL,XXL}', 28, false, 4.6, 154, now() - interval '14 days'),
('Devanagari Minimal Tee', 'A single Devanagari character, printed small over the heart. For people who like their statements quiet. 240 GSM combed cotton.', 'tshirt', 649, 1099, '["https://picsum.photos/seed/dhana-tee6/900/1200","https://picsum.photos/seed/dhana-tee6b/900/1200"]', '{S,M,L,XL,XXL}', 51, false, 4.7, 203, now() - interval '20 days'),
('Temple Border Silk Saree', 'Digital silk saree with a classic temple border reimagined in vermillion and gold. Comes with an unstitched blouse piece. 5.5m + 0.8m.', 'saree', 2499, 4499, '["https://picsum.photos/seed/dhana-sar1/900/1200","https://picsum.photos/seed/dhana-sar1b/900/1200"]', '{Free Size}', 18, true, 4.9, 88, now() - interval '3 hours'),
('Sunset Organza Saree', 'Featherlight printed organza in a gradient of dusk tones — but abstract, like spilled ink. Finished with a hand-rolled edge.', 'saree', 1599, 2899, '["https://picsum.photos/seed/dhana-sar2/900/1200","https://picsum.photos/seed/dhana-sar2b/900/1200"]', '{Free Size}', 24, true, 4.6, 71, now() - interval '1 day'),
('Ajrakh Modal Saree', 'Traditional Ajrakh geometry, printed digitally on buttery modal fabric. Drapes like liquid. Includes blouse piece.', 'saree', 1899, 3299, '["https://picsum.photos/seed/dhana-sar3/900/1200","https://picsum.photos/seed/dhana-sar3b/900/1200"]', '{Free Size}', 15, false, 4.7, 64, now() - interval '8 days'),
('Midnight Kanjivaram Silk', 'Deep indigo body with a contrast zari border, printed on silk-touch fabric with a real zari fall. Statement piece for evenings.', 'saree', 2999, 4999, '["https://picsum.photos/seed/dhana-sar4/900/1200","https://picsum.photos/seed/dhana-sar4b/900/1200"]', '{Free Size}', 9, false, 4.8, 52, now() - interval '12 days'),
('Indigo Ikat Cotton Saree', 'Ikat-inspired print on crisp handloom-feel cotton. Light, everyday, and it softens beautifully with every wash.', 'saree', 1299, 2499, '["https://picsum.photos/seed/dhana-sar5/900/1200","https://picsum.photos/seed/dhana-sar5b/900/1200"]', '{Free Size}', 33, false, 4.5, 118, now() - interval '16 days'),
('Peacock Zari Silk Saree', 'Peacock motifs scattered across a jewel-toned body with woven-look zari borders. Printed on silk-touch fabric, blouse piece included.', 'saree', 2199, 3999, '["https://picsum.photos/seed/dhana-sar6/900/1200","https://picsum.photos/seed/dhana-sar6b/900/1200"]', '{Free Size}', 21, false, 4.8, 77, now() - interval '25 days');