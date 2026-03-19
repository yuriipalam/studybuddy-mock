
CREATE TABLE public.call_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  caller_id text NOT NULL,
  caller_name text NOT NULL DEFAULT '',
  receiver_id text NOT NULL,
  receiver_name text NOT NULL DEFAULT '',
  call_type text NOT NULL DEFAULT 'voice',
  status text NOT NULL DEFAULT 'missed',
  duration integer NOT NULL DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on call_history" ON public.call_history FOR ALL TO public USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.call_history;
