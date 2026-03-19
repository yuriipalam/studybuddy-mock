
-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);

-- Create chat_files table to track file metadata
CREATE TABLE public.chat_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  sender_id text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on chat_files" ON public.chat_files
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Storage RLS: allow public read/write
CREATE POLICY "Allow public read on chat-files" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'chat-files');

CREATE POLICY "Allow public insert on chat-files" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Allow public delete on chat-files" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'chat-files');
