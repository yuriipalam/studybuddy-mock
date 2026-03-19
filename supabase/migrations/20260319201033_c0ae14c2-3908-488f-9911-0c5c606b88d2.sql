CREATE TABLE public.thesis_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  current_stage text NOT NULL DEFAULT 'topic_selection',
  stages jsonb NOT NULL DEFAULT '[
    {"id":"topic_selection","label":"Topic Selection","status":"in_progress"},
    {"id":"supervisor_approval","label":"Supervisor Approval","status":"locked"},
    {"id":"literature_review","label":"Literature Review","status":"locked"},
    {"id":"research","label":"Research","status":"locked"},
    {"id":"writing","label":"Writing","status":"locked"},
    {"id":"submission","label":"Submission","status":"locked"}
  ]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.thesis_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on thesis_journeys" ON public.thesis_journeys FOR ALL TO public USING (true) WITH CHECK (true);