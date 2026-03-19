
-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Since we use predefined mock accounts (no real auth), allow all operations
-- These should be tightened when real auth is implemented
CREATE POLICY "Allow all on conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on conversation_participants" ON public.conversation_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
