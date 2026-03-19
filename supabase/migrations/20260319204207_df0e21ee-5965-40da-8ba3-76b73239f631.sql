
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  xp_amount INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'success' CHECK (type IN ('success', 'warning')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- XP activity log
CREATE TABLE public.xp_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'profile',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow all access since we use mock auth (no auth.uid())
CREATE POLICY "Allow all access to notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to xp_activity_log" ON public.xp_activity_log FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
