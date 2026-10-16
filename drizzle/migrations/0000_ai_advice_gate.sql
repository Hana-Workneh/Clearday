CREATE TABLE public.ai_advice_gate (id text PRIMARY KEY, status integer NOT NULL, message text NOT NULL, kind text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.ai_advice_gate TO service_role;
ALTER TABLE public.ai_advice_gate ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.ai_advice_gate IS 'Service-only durable AI pause and provider-denial state; contains no personal data.';