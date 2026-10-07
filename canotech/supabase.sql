-- Ejecutar en Supabase: SQL Editor > New query
create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null default 'Accesorio',
  price numeric(12,0) not null default 0,
  description text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  icon text default '🔧',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.services enable row level security;

-- Lectura pública (productos inactivos solo los ve un usuario autenticado)
create policy "products_read" on public.products for select
  to anon, authenticated using (active = true or auth.role() = 'authenticated');
create policy "services_read" on public.services for select
  to anon, authenticated using (true);

-- Escritura solo con sesión iniciada
create policy "products_write" on public.products for all
  to authenticated using (true) with check (true);
create policy "services_write" on public.services for all
  to authenticated using (true) with check (true);

-- IMPORTANTE: en Authentication > Providers > Email desactiva "Allow new users to sign up"
-- y crea tu usuario administrador manualmente en Authentication > Users,
-- porque cualquier usuario autenticado puede escribir.
