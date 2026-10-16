CREATE TABLE public.ai_advice_usage (user_id uuid NOT NULL, day date NOT NULL, count integer NOT NULL DEFAULT 0, PRIMARY KEY (user_id, day));
GRANT ALL ON public.ai_advice_usage TO service_role;
ALTER TABLE public.ai_advice_usage ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_ai_advice(_user uuid, _limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  INSERT INTO public.ai_advice_usage(user_id, day, count) VALUES (_user, (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET count = ai_advice_usage.count + 1 WHERE ai_advice_usage.count < _limit
  RETURNING count INTO n;
  RETURN n IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.claim_ai_advice(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_advice(uuid, integer) TO service_role;