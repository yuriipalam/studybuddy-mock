
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS university text DEFAULT '';
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS field_ids text[] DEFAULT '{}';
