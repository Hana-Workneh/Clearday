CREATE TABLE public.sprout_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, message_id text NOT NULL, role text NOT NULL CHECK (role IN ('user','assistant')), parts jsonb NOT NULL CHECK (jsonb_typeof(parts) = 'array'), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,message_id));
GRANT SELECT, INSERT, UPDATE ON public.sprout_messages TO authenticated;
GRANT ALL ON public.sprout_messages TO service_role;
ALTER TABLE public.sprout_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY sprout_read_own ON public.sprout_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY sprout_insert_own ON public.sprout_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY sprout_update_own ON public.sprout_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TABLE public.sprout_usage (visitor text NOT NULL, day date NOT NULL, count integer NOT NULL DEFAULT 0, PRIMARY KEY(visitor,day));
GRANT ALL ON public.sprout_usage TO service_role;
ALTER TABLE public.sprout_usage ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_sprout_question(_visitor text, _demo boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
INSERT INTO public.sprout_usage(visitor,day,count) VALUES(_visitor,(now() AT TIME ZONE 'utc')::date,1)
ON CONFLICT(visitor,day) DO UPDATE SET count = sprout_usage.count + 1 WHERE sprout_usage.count < CASE WHEN _demo THEN 5 ELSE 10 END RETURNING count INTO n;
RETURN n IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.claim_sprout_question(text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_sprout_question(text,boolean) TO service_role;