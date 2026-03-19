
CREATE TABLE public.topic_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  topic_id text NOT NULL,
  motivation text DEFAULT '',
  availability text DEFAULT '',
  scheduling_url text DEFAULT '',
  cv_file_path text DEFAULT '',
  cv_file_name text DEFAULT '',
  avatar_url text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE public.topic_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on topic_applications" ON public.topic_applications
  FOR ALL TO public USING (true) WITH CHECK (true);
