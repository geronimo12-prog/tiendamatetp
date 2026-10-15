-- TIENDAMATETP V22 · Precio anterior / ofertas
-- Ejecutar UNA VEZ en Supabase > SQL Editor.

alter table public.products
  add column if not exists compare_at_price numeric(12,2);

alter table public.products
  drop constraint if exists products_compare_at_price_check;

alter table public.products
  add constraint products_compare_at_price_check
  check (compare_at_price is null or compare_at_price >= 0);

comment on column public.products.compare_at_price is
  'Precio anterior opcional. Si es mayor que price, la tienda lo muestra tachado como oferta.';
