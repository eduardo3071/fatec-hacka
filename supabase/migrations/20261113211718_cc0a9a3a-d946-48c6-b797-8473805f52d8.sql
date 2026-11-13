create table public.producers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,40}$'),
  name text not null,
  phone text,
  municipality text,
  pix_key text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.producers (id) on delete cascade,
  name text not null,
  unit text not null check (unit in ('maco', 'duzia', 'engradado', 'kg', 'unidade', 'caixa')),
  price numeric(10, 2) not null check (price >= 0),
  intermediary_price numeric(10, 2) check (intermediary_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (producer_id, name, unit)
);

create table public.buyers (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.producers (id) on delete cascade,
  name text not null,
  phone text not null,
  device_id text,
  created_at timestamptz not null default now(),
  unique (producer_id, phone)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.producers (id) on delete cascade,
  buyer_id uuid not null references public.buyers (id) on delete restrict,
  status text not null default 'pendente'
    check (status in ('pendente', 'aceito', 'recusado', 'entregue', 'cancelado')),
  payment_status text not null default 'a_receber'
    check (payment_status in ('a_receber', 'pago')),
  delivery_date date not null,
  delivery_time time not null,
  notes text,
  source text not null default 'toque' check (source in ('toque', 'voz')),
  tracking_token text not null unique,
  device_id text,
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  delivered_at timestamptz,
  paid_at timestamptz
);
create index orders_producer_date_idx on public.orders (producer_id, delivery_date, status);
create index orders_device_idx on public.orders (device_id, created_at);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit text not null,
  quantity numeric(10, 2) not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  intermediary_price numeric(10, 2) check (intermediary_price >= 0)
);
create index order_items_order_idx on public.order_items (order_id);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid references public.producers (id) on delete set null,
  device_id text,
  kind text not null check (kind in ('llm', 'transcription')),
  model text,
  tokens_in integer,
  tokens_out integer,
  audio_seconds numeric(10, 2),
  cost_brl numeric(10, 4) not null default 0,
  created_at timestamptz not null default now()
);
create index usage_events_producer_idx on public.usage_events (producer_id, created_at);
create index usage_events_device_idx on public.usage_events (device_id, created_at);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.producers (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);