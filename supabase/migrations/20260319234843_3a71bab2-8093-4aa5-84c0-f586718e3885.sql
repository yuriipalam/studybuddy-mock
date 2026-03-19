CREATE POLICY "Allow insert on student_xp" ON public.student_xp FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow update on student_xp" ON public.student_xp FOR UPDATE TO public USING (true) WITH CHECK (true);