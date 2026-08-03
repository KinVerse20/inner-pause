insert into public.profiles (id, auth_provider, auth_provider_subject, full_name, email, onboarding_completed)
values
  ('11111111-1111-4111-8111-111111111111', 'cognito', 'test-cognito-sub-sahil', 'Sahil Test', 'sahil.test@example.com', true)
on conflict (email) do nothing;

insert into public.journal_entries (id, user_id, title, raw_text, save_mode, emotional_intensity_before)
values
  (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'A steady test reflection',
    'I felt scattered today and wanted a short pause to feel grounded again.',
    'journal_and_analysis',
    7
  )
on conflict (id) do nothing;

insert into public.emotional_analyses (
  id,
  user_id,
  journal_entry_id,
  summary,
  emotions_json,
  triggers_json,
  chakra_analysis_json,
  suggested_outcome,
  recommended_duration,
  safety_flag,
  model_version
)
values
  (
    '33333333-3333-4333-8333-333333333333',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    'Test reflection suggests a need for steadiness and a calm reset.',
    '[{"name":"Overwhelm","intensity":6,"level":"medium"}]',
    '["Emotional load"]',
    '[{"chakra":"root","reason":"A grounding pause may help create steadiness.","confidence":0.7}]',
    'Feel more grounded and present.',
    10,
    false,
    'aws-test-seed'
  )
on conflict (id) do nothing;

