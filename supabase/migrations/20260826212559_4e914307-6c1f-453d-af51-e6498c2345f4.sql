REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.compute_sale_financials() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_sale_from_items() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_sale_item_stock() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;