
ALTER TABLE public.milestones ADD COLUMN description text NOT NULL DEFAULT '';
ALTER TABLE public.milestones ADD COLUMN topic_id text;
