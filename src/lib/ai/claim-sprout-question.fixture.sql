CREATE TABLE public.sprout_demo_daily_usage (
  day date PRIMARY KEY,
  count integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.sprout_demo_daily_usage TO service_role;
ALTER TABLE public.sprout_demo_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_sprout_question(_visitor text, _demo boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_day date := (now() AT TIME ZONE 'utc')::date;
  visitor_count integer;
  total_count integer;
  n integer;
BEGIN
  IF NOT _demo THEN
    INSERT INTO public.sprout_usage(visitor, day, count)
    VALUES (_visitor, usage_day, 1)
    ON CONFLICT (visitor, day) DO UPDATE
      SET count = sprout_usage.count + 1
      WHERE sprout_usage.count < 10
    RETURNING count INTO n;
    RETURN n IS NOT NULL;
  END IF;

  -- Lock the shared day first so simultaneous visitors cannot overspend.
  INSERT INTO public.sprout_demo_daily_usage(day, count)
  VALUES (usage_day, 0) ON CONFLICT (day) DO NOTHING;
  SELECT count INTO total_count FROM public.sprout_demo_daily_usage
    WHERE day = usage_day FOR UPDATE;
  IF total_count >= 500 THEN RETURN false; END IF;

  INSERT INTO public.sprout_usage(visitor, day, count)
  VALUES (_visitor, usage_day, 0) ON CONFLICT (visitor, day) DO NOTHING;
  SELECT count INTO visitor_count FROM public.sprout_usage
    WHERE visitor = _visitor AND day = usage_day FOR UPDATE;
  IF visitor_count >= 15 THEN RETURN false; END IF;

  -- Both increments commit together, only when both budgets allow it.
  UPDATE public.sprout_usage SET count = count + 1
    WHERE visitor = _visitor AND day = usage_day;
  UPDATE public.sprout_demo_daily_usage SET count = count + 1
    WHERE day = usage_day;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_sprout_question(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_sprout_question(text, boolean) TO service_role;