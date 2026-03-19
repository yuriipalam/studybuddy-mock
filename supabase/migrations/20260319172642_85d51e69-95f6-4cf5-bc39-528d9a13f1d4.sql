
CREATE TABLE public.pinned_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  pinned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, conversation_id)
);

ALTER TABLE public.pinned_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on pinned_conversations" ON public.pinned_conversations
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);
