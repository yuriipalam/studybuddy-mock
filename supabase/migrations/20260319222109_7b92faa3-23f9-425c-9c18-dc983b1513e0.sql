-- Add last_seen_at to track online status
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT now();

-- Add reply_token to conversations for email reply routing
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS reply_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');