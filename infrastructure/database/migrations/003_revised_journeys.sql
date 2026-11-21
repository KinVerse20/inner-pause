CREATE TABLE IF NOT EXISTS public.revised_emotion_catalog (
  version text PRIMARY KEY,
  document jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revised_journeys (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS revised_journeys_user_created ON public.revised_journeys(user_id, created_at DESC);
