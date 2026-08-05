-- roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- first user becomes admin, everyone else a normal user
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_roles
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- backfill existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::public.app_role FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users ORDER BY created_at ASC LIMIT 1
ON CONFLICT DO NOTHING;

-- blog posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Untitled post',
  excerpt text,
  cover_path text,
  tags text[] NOT NULL DEFAULT '{}',
  body_md text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT SELECT ON public.blog_posts TO anon;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published posts are public" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "authors read own posts" ON public.blog_posts
  FOR SELECT TO authenticated USING (author_id = auth.uid());
CREATE POLICY "authors insert own posts" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "authors update own posts" ON public.blog_posts
  FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "authors delete own posts" ON public.blog_posts
  FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX blog_posts_published_idx ON public.blog_posts (is_published, published_at DESC);

-- blog settings (single row)
CREATE TABLE public.blog_settings (
  id boolean PRIMARY KEY DEFAULT true,
  title text NOT NULL DEFAULT 'Folio Blog',
  description text NOT NULL DEFAULT 'লেখা, নোট আর টেকনিক্যাল ব্রেকডাউন।',
  accent text NOT NULL DEFAULT '#6ee7f9',
  font text NOT NULL DEFAULT 'space-grotesk',
  layout text NOT NULL DEFAULT 'list',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_settings_singleton CHECK (id = true)
);

GRANT SELECT ON public.blog_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.blog_settings TO authenticated;
GRANT ALL ON public.blog_settings TO service_role;
ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog settings are public" ON public.blog_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins insert blog settings" ON public.blog_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update blog settings" ON public.blog_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER blog_settings_updated_at BEFORE UPDATE ON public.blog_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.blog_settings (id) VALUES (true) ON CONFLICT DO NOTHING;