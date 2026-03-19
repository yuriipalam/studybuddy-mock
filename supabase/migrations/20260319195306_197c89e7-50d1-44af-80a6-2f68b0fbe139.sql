
-- Student XP table
CREATE TABLE public.student_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL UNIQUE,
  university_id TEXT NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  xp_supervisor INTEGER NOT NULL DEFAULT 0,
  xp_research INTEGER NOT NULL DEFAULT 0,
  xp_referrals INTEGER NOT NULL DEFAULT 0,
  xp_profile INTEGER NOT NULL DEFAULT 0,
  rank_change INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read (ranking is public data)
ALTER TABLE public.student_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read student_xp" ON public.student_xp
  FOR SELECT TO anon, authenticated USING (true);

-- Seed data for 40 students
-- 80% (32 students) < 1000 XP, 20% (8 students) >= 1000 XP, max 2680
INSERT INTO public.student_xp (student_id, university_id, total_xp, xp_supervisor, xp_research, xp_referrals, xp_profile, rank_change) VALUES
-- Top tier (1000-2680 XP) - 8 students
('student-01', 'uni-01', 2680, 850, 920, 560, 350, 2),
('student-04', 'uni-01', 2410, 780, 830, 500, 300, -1),
('student-07', 'uni-02', 2250, 720, 780, 450, 300, 3),
('student-05', 'uni-02', 1980, 640, 650, 400, 290, 0),
('student-22', 'uni-06', 1750, 560, 580, 350, 260, -2),
('student-09', 'uni-03', 1520, 490, 500, 300, 230, 1),
('student-02', 'uni-01', 1250, 480, 350, 250, 170, 4),
('student-37', 'uni-10', 1080, 350, 380, 200, 150, -1),
-- Mid tier (400-999 XP) - 16 students
('student-08', 'uni-02', 960, 310, 320, 180, 150, 2),
('student-11', 'uni-03', 920, 300, 300, 170, 150, -1),
('student-14', 'uni-04', 880, 280, 290, 170, 140, 0),
('student-30', 'uni-08', 840, 270, 280, 160, 130, 3),
('student-15', 'uni-04', 790, 250, 260, 150, 130, -2),
('student-18', 'uni-05', 740, 240, 240, 140, 120, 1),
('student-26', 'uni-07', 700, 220, 230, 130, 120, 0),
('student-34', 'uni-09', 660, 210, 220, 120, 110, 2),
('student-13', 'uni-03', 610, 190, 200, 120, 100, -1),
('student-20', 'uni-05', 570, 180, 190, 110, 90, 1),
('student-29', 'uni-07', 530, 170, 170, 100, 90, 0),
('student-32', 'uni-08', 490, 150, 160, 100, 80, -1),
('student-38', 'uni-10', 460, 140, 150, 90, 80, 2),
('student-06', 'uni-02', 430, 130, 140, 90, 70, 0),
('student-10', 'uni-03', 410, 130, 130, 80, 70, -1),
('student-36', 'uni-09', 400, 120, 130, 80, 70, 1),
-- Low tier (0-399 XP) - 16 students
('student-03', 'uni-01', 350, 110, 110, 70, 60, 0),
('student-12', 'uni-03', 310, 100, 100, 60, 50, -1),
('student-16', 'uni-04', 280, 90, 90, 50, 50, 1),
('student-17', 'uni-04', 250, 80, 80, 50, 40, 0),
('student-19', 'uni-05', 220, 70, 70, 40, 40, -1),
('student-21', 'uni-05', 190, 60, 60, 40, 30, 0),
('student-23', 'uni-06', 160, 50, 50, 30, 30, 1),
('student-24', 'uni-06', 130, 40, 40, 30, 20, 0),
('student-25', 'uni-06', 100, 30, 30, 20, 20, -1),
('student-27', 'uni-07', 80, 20, 30, 20, 10, 0),
('student-28', 'uni-07', 60, 20, 20, 10, 10, 1),
('student-31', 'uni-08', 40, 10, 10, 10, 10, 0),
('student-33', 'uni-08', 20, 10, 10, 0, 0, 0),
('student-35', 'uni-09', 10, 0, 10, 0, 0, 0),
('student-39', 'uni-10', 5, 0, 5, 0, 0, 0),
('student-40', 'uni-10', 0, 0, 0, 0, 0, 0);
