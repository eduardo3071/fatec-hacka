create or replace function public.owned_producer_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.producers where user_id = auth.uid()
$$;

alter table public.producers enable row level security;
alter table public.products enable row level security;
alter table public.buyers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.usage_events enable row level security;
alter table public.push_subscriptions enable row level security;

create policy producers_select_own on public.producers
  for select to authenticated using (user_id = auth.uid());

create policy products_select_own on public.products
  for select to authenticated using (producer_id in (select public.owned_producer_ids()));

create policy buyers_select_own on public.buyers
  for select to authenticated using (producer_id in (select public.owned_producer_ids()));

create policy orders_select_own on public.orders
  for select to authenticated using (producer_id in (select public.owned_producer_ids()));

create policy order_items_select_own on public.order_items
  for select to authenticated using (
    order_id in (
      select id from public.orders
      where producer_id in (select public.owned_producer_ids())
    )
  );

create policy usage_events_select_own on public.usage_events
  for select to authenticated using (producer_id in (select public.owned_producer_ids()));

alter publication supabase_realtime add table public.orders;

-- Necessário para o frontend conseguir ler (o Supabase não concede por padrão). Só leitura, só logado.
grant select on public.producers, public.products, public.buyers, public.orders, public.order_items, public.usage_events to authenticated;
grant all on public.producers, public.products, public.buyers, public.orders, public.order_items, public.usage_events, public.push_subscriptions to service_role;
revoke execute on function public.owned_producer_ids() from public, anon;
grant execute on function public.owned_producer_ids() to authenticated;