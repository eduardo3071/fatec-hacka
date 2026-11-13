-- Colheita Certa · Fase 1 · dados de demonstração (TODOS SIMULADOS)
-- Antes de rodar: crie um usuário no login do app (ou no painel do Supabase)
-- e troque o e-mail abaixo pelo dele. Preços e compradores são fictícios.

do $$
declare
  v_email text := 'TROQUE-POR-SEU-EMAIL@exemplo.com';
  v_user uuid;
  v_producer uuid;
  v_alface uuid; v_couve uuid; v_brocolis uuid; v_cenoura uuid;
  v_b1 uuid; v_b2 uuid;
  v_o1 uuid; v_o2 uuid;
begin
  select id into v_user from auth.users where email = v_email;
  if v_user is null then
    raise exception 'Usuário % não encontrado em auth.users', v_email;
  end if;

  insert into public.producers (user_id, slug, name, phone, municipality, pix_key)
  values (v_user, 'marcos-biritiba', 'Marcos (demo)', '11999990000', 'Biritiba-Mirim', 'marcos@demo.exemplo')
  on conflict (user_id) do update set slug = excluded.slug
  returning id into v_producer;

  insert into public.products (producer_id, name, unit, price, intermediary_price) values
    (v_producer, 'Alface crespa', 'maco', 3.50, 2.00),
    (v_producer, 'Couve', 'maco', 3.00, 1.80),
    (v_producer, 'Brócolis', 'maco', 6.00, 4.00),
    (v_producer, 'Cenoura', 'kg', 4.00, 2.80),
    (v_producer, 'Rúcula', 'maco', 3.50, 2.20)
  on conflict do nothing;

  select id into v_alface from public.products where producer_id = v_producer and name = 'Alface crespa';
  select id into v_couve from public.products where producer_id = v_producer and name = 'Couve';
  select id into v_brocolis from public.products where producer_id = v_producer and name = 'Brócolis';
  select id into v_cenoura from public.products where producer_id = v_producer and name = 'Cenoura';

  insert into public.buyers (producer_id, name, phone, device_id) values
    (v_producer, 'Restaurante A (demo)', '11911110000', 'demo-device-a'),
    (v_producer, 'Mercadinho B (demo)', '11922220000', 'demo-device-b')
  on conflict (producer_id, phone) do nothing;
  select id into v_b1 from public.buyers where producer_id = v_producer and phone = '11911110000';
  select id into v_b2 from public.buyers where producer_id = v_producer and phone = '11922220000';

  insert into public.orders (producer_id, buyer_id, status, delivery_date, delivery_time, source, tracking_token, device_id, total)
  values (v_producer, v_b1, 'aceito', current_date + 1, '07:00', 'toque', 'demo-token-restaurante-a', 'demo-device-a', 100.00)
  returning id into v_o1;
  insert into public.order_items (order_id, product_id, product_name, unit, quantity, unit_price, intermediary_price) values
    (v_o1, v_alface, 'Alface crespa', 'maco', 20, 3.50, 2.00),
    (v_o1, v_couve, 'Couve', 'maco', 10, 3.00, 1.80);

  insert into public.orders (producer_id, buyer_id, status, delivery_date, delivery_time, source, tracking_token, device_id, total)
  values (v_producer, v_b2, 'aceito', current_date + 1, '06:40', 'voz', 'demo-token-mercadinho-b', 'demo-device-b', 87.50)
  returning id into v_o2;
  insert into public.order_items (order_id, product_id, product_name, unit, quantity, unit_price, intermediary_price) values
    (v_o2, v_alface, 'Alface crespa', 'maco', 15, 3.50, 2.00),
    (v_o2, v_brocolis, 'Brócolis', 'maco', 5, 6.00, 4.00);
end $$;
