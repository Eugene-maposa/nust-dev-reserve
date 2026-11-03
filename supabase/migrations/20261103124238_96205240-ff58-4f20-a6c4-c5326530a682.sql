CREATE TABLE public.unregistered_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.unregistered_scans TO authenticated;
GRANT ALL ON public.unregistered_scans TO service_role;
ALTER TABLE public.unregistered_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage unregistered scans" ON public.unregistered_scans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.lookup_user_by_code(p_code text)
RETURNS TABLE(id uuid, email text, full_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, email, full_name FROM public.user_profiles
  WHERE length(trim(p_code)) >= 4 AND (student_number = trim(p_code) OR code = trim(p_code))
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.lookup_user_by_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.report_unregistered_scan(p_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF length(trim(p_code)) < 4 OR length(p_code) > 64 THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.unregistered_scans WHERE scanned_code = trim(p_code) AND status = 'pending') THEN
    UPDATE public.unregistered_scans SET created_at = now() WHERE scanned_code = trim(p_code) AND status = 'pending';
  ELSE
    INSERT INTO public.unregistered_scans(scanned_code) VALUES (trim(p_code));
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.report_unregistered_scan(text) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.unregistered_scans;