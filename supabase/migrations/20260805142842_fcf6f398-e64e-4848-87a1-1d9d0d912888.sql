DROP FUNCTION IF EXISTS public.increment_portfolio_views(text);
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;