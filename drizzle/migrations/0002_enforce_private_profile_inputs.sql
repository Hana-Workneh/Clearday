REVOKE ALL ON public.ai_advice_gate FROM anon, authenticated;
GRANT ALL ON public.ai_advice_gate TO service_role;
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
CREATE OR REPLACE FUNCTION public.clean_clearday_json(value jsonb) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
 CASE jsonb_typeof(value)
 WHEN 'string' THEN RETURN to_jsonb(btrim(regexp_replace(value #>> '{}', '[[:cntrl:]]', '', 'g')));
 WHEN 'array' THEN SELECT coalesce(jsonb_agg(public.clean_clearday_json(v)), '[]'::jsonb) INTO result FROM jsonb_array_elements(value) v; RETURN result;
 WHEN 'object' THEN SELECT coalesce(jsonb_object_agg(k, public.clean_clearday_json(v)), '{}'::jsonb) INTO result FROM jsonb_each(value) AS e(k,v); RETURN result;
 ELSE RETURN value;
 END CASE;
END;
$$;
CREATE OR REPLACE FUNCTION public.validate_clearday_profile() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE entry jsonb; field text; num numeric;
BEGIN
 NEW.display_name := btrim(regexp_replace(NEW.display_name, '[[:cntrl:]]', '', 'g'));
 IF length(NEW.display_name) > 100 THEN RAISE EXCEPTION 'Keep your name under 100 characters'; END IF;
 IF NEW.data IS NULL THEN RETURN NEW; END IF;
 IF jsonb_typeof(NEW.data) <> 'object' OR octet_length(NEW.data::text) > 2000000 THEN RAISE EXCEPTION 'Please check your saved details'; END IF;
 NEW.data := public.clean_clearday_json(NEW.data);
 IF jsonb_typeof(NEW.data->'name') IS DISTINCT FROM 'string' OR length(NEW.data->>'name') NOT BETWEEN 1 AND 100 OR jsonb_typeof(NEW.data->'job') IS DISTINCT FROM 'string' OR length(NEW.data->>'job') > 160 THEN RAISE EXCEPTION 'Please check your name and job title'; END IF;
 IF jsonb_typeof(NEW.data->'income') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Please check your income'; END IF;
 IF (NEW.data->>'income')::numeric <= 0 OR (NEW.data->>'income')::numeric > 100000000 THEN RAISE EXCEPTION 'Please check your income'; END IF;
 IF NEW.data ? 'currency' AND NEW.data->>'currency' NOT IN ('USD','RWF','KES','ETB') THEN RAISE EXCEPTION 'Choose a supported currency'; END IF;
 IF NEW.data ? 'theme' AND NEW.data->>'theme' NOT IN ('light','dark') THEN RAISE EXCEPTION 'Choose light or dark'; END IF;
 IF jsonb_typeof(NEW.data->'loans') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Please check your loans'; END IF;
 IF jsonb_array_length(NEW.data->'loans') > 100 THEN RAISE EXCEPTION 'Save up to 100 loans'; END IF;
 FOR entry IN SELECT * FROM jsonb_array_elements(NEW.data->'loans') LOOP
  IF jsonb_typeof(entry) <> 'object' OR jsonb_typeof(entry->'id') IS DISTINCT FROM 'string' OR length(entry->>'id') NOT BETWEEN 1 AND 100 OR jsonb_typeof(entry->'name') IS DISTINCT FROM 'string' OR length(entry->>'name') NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'Please check each loan name'; END IF;
  FOREACH field IN ARRAY ARRAY['balance','startBalance','rate','payment'] LOOP
   IF jsonb_typeof(entry->field) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Use numbers for loan amounts and rates'; END IF;
   num := (entry->>field)::numeric;
   IF num < 0 OR num > (CASE WHEN field='rate' THEN 1000 ELSE 100000000 END) OR (field='payment' AND num=0) THEN RAISE EXCEPTION 'Please check loan amounts and rates'; END IF;
  END LOOP;
 END LOOP;
 IF NEW.data ? 'payments' THEN
  IF jsonb_typeof(NEW.data->'payments') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Please check your payments'; END IF;
  IF jsonb_array_length(NEW.data->'payments') > 10000 THEN RAISE EXCEPTION 'Your payment history is too large'; END IF;
  FOR entry IN SELECT * FROM jsonb_array_elements(NEW.data->'payments') LOOP
   IF jsonb_typeof(entry->'id') IS DISTINCT FROM 'string' OR length(entry->>'id') NOT BETWEEN 1 AND 100 OR jsonb_typeof(entry->'loanId') IS DISTINCT FROM 'string' OR length(entry->>'loanId') NOT BETWEEN 1 AND 100 OR jsonb_typeof(entry->'amount') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Please check your payment amount'; END IF;
   IF (entry->>'amount')::numeric <= 0 OR (entry->>'amount')::numeric > 100000000 THEN RAISE EXCEPTION 'Please check your payment amount'; END IF;
   IF jsonb_typeof(entry->'date') IS DISTINCT FROM 'string' OR entry->>'date' !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'Choose a real payment date'; END IF;
   IF to_char((entry->>'date')::date, 'YYYY-MM-DD') <> entry->>'date' OR (entry->>'date')::date > CURRENT_DATE THEN RAISE EXCEPTION 'Choose a real payment date up to today'; END IF;
  END LOOP;
 END IF;
 IF NEW.data ? 'plan' THEN
  entry := NEW.data->'plan';
  IF jsonb_typeof(entry) <> 'object' THEN RAISE EXCEPTION 'Please check your plan'; END IF;
  IF entry ? 'strategy' AND entry->>'strategy' NOT IN ('avalanche','snowball','order') THEN RAISE EXCEPTION 'Choose a loan order'; END IF;
  IF entry ? 'extra' THEN
   IF jsonb_typeof(entry->'extra') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Please check your extra amount'; END IF;
   IF (entry->>'extra')::numeric < 0 OR (entry->>'extra')::numeric > 100000000 THEN RAISE EXCEPTION 'Please check your extra amount'; END IF;
  END IF;
 END IF;
 FOR entry IN SELECT NEW.data->'catchUp' UNION ALL SELECT NEW.data->'plan'->'boost' LOOP
  IF entry IS NOT NULL THEN
   IF jsonb_typeof(entry) <> 'object' OR jsonb_typeof(entry->'amount') IS DISTINCT FROM 'number' OR jsonb_typeof(entry->'months') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Please check your catch-up plan'; END IF;
   IF (entry->>'amount')::numeric NOT BETWEEN 0 AND 100000000 OR (entry->>'months')::numeric NOT BETWEEN 1 AND 600 OR (entry->>'months')::numeric <> trunc((entry->>'months')::numeric) THEN RAISE EXCEPTION 'Please check your catch-up plan'; END IF;
  END IF;
 END LOOP;
 IF NEW.data ? 'savingsGoal' THEN
  entry := NEW.data->'savingsGoal';
  IF jsonb_typeof(entry->'name') IS DISTINCT FROM 'string' OR length(entry->>'name') NOT BETWEEN 1 AND 100 OR jsonb_typeof(entry->'amount') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Please check your savings goal'; END IF;
  IF (entry->>'amount')::numeric <= 0 OR (entry->>'amount')::numeric > 100000000 THEN RAISE EXCEPTION 'Please check your savings goal'; END IF;
 END IF;
 IF NEW.data ? 'startedAt' THEN PERFORM (NEW.data->>'startedAt')::timestamptz; END IF;
 IF NEW.data->>'startDebtFree' IS NOT NULL THEN PERFORM (NEW.data->>'startDebtFree')::timestamptz; END IF;
 IF NEW.data ? 'catchUp' THEN PERFORM (NEW.data->'catchUp'->>'from')::timestamptz; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.data->'loans') l GROUP BY l->>'id' HAVING count(*) > 1) OR EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(NEW.data->'payments','[]'::jsonb)) p GROUP BY p->>'id' HAVING count(*) > 1) THEN RAISE EXCEPTION 'Use unique saved record IDs'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER validate_clearday_profile_before_write BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_clearday_profile();
REVOKE ALL ON FUNCTION public.validate_clearday_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.clean_clearday_json(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clean_clearday_json(jsonb) TO authenticated, service_role;