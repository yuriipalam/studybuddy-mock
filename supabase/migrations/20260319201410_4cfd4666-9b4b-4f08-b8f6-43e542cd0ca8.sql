CREATE TABLE public.user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'student',
  avatar text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on user_accounts" ON public.user_accounts FOR ALL TO public USING (true) WITH CHECK (true);