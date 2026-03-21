
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read site settings" ON public.site_settings
  FOR SELECT TO public USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default row so we know when location hasn't been set yet
INSERT INTO public.site_settings (key, value) VALUES ('centre_location', '{"lat": null, "lng": null, "set": false}'::jsonb);
