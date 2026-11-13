create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.owned_producer_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$ select id from public.producers where user_id = auth.uid() $$;
revoke execute on function private.owned_producer_ids() from public, anon;
grant execute on function private.owned_producer_ids() to authenticated;

drop policy products_select_own on public.products;
drop policy buyers_select_own on public.buyers;
drop policy orders_select_own on public.orders;
drop policy order_items_select_own on public.order_items;
drop policy usage_events_select_own on public.usage_events;

create policy products_select_own on public.products for select to authenticated using (producer_id in (select private.owned_producer_ids()));
create policy buyers_select_own on public.buyers for select to authenticated using (producer_id in (select private.owned_producer_ids()));
create policy orders_select_own on public.orders for select to authenticated using (producer_id in (select private.owned_producer_ids()));
create policy order_items_select_own on public.order_items for select to authenticated using (order_id in (select id from public.orders where producer_id in (select private.owned_producer_ids())));
create policy usage_events_select_own on public.usage_events for select to authenticated using (producer_id in (select private.owned_producer_ids()));

drop function public.owned_producer_ids();