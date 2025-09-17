-- Phase 1: Create Today's Queue (Draft)
INSERT INTO public.queues (id, date, status, total_slots, filled_slots, notes, created_by_id)
VALUES (
  gen_random_uuid(),
  CURRENT_DATE,
  'draft',
  10,
  8,
  'Daily support queue - awaiting approval',
  (SELECT id FROM auth.users LIMIT 1)
);

-- Phase 2: Create Yesterday's Queue (Published)
INSERT INTO public.queues (id, date, status, total_slots, filled_slots, notes, created_by_id, approved_at, published_at)
VALUES (
  gen_random_uuid(),
  CURRENT_DATE - INTERVAL '1 day',
  'published',
  12,
  12,
  'Completed daily queue',
  (SELECT id FROM auth.users LIMIT 1),
  CURRENT_DATE - INTERVAL '1 day' + INTERVAL '2 hours',
  CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
);

-- Phase 3: Create Queue from 3 days ago (Approved)
INSERT INTO public.queues (id, date, status, total_slots, filled_slots, notes, created_by_id, approved_at)
VALUES (
  gen_random_uuid(),
  CURRENT_DATE - INTERVAL '3 days',
  'approved',
  8,
  8,
  'Queue ready for publishing',
  (SELECT id FROM auth.users LIMIT 1),
  CURRENT_DATE - INTERVAL '3 days' + INTERVAL '3 hours'
);

-- Phase 4: Generate Queue Assignments for Today's Queue
WITH today_queue AS (
  SELECT id as queue_id FROM public.queues WHERE date = CURRENT_DATE LIMIT 1
),
available_members AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY net_credits DESC) as rn 
  FROM public.members 
  WHERE status = 'active' 
  LIMIT 4
),
available_submissions AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn 
  FROM public.submissions 
  WHERE status = 'approved'
  LIMIT 5
)
INSERT INTO public.queue_assignments (
  queue_id, 
  submission_id, 
  supporter_id, 
  position, 
  credits_allocated, 
  status,
  proof_url,
  completed_at,
  proof_submitted_at
)
SELECT 
  tq.queue_id,
  s.id as submission_id,
  m.id as supporter_id,
  s.rn as position,
  CASE s.rn
    WHEN 1 THEN 150
    WHEN 2 THEN 120
    WHEN 3 THEN 100
    WHEN 4 THEN 80
    ELSE 60
  END as credits_allocated,
  CASE s.rn
    WHEN 1 THEN 'completed'
    WHEN 2 THEN 'completed'
    WHEN 3 THEN 'assigned'
    WHEN 4 THEN 'assigned'
    ELSE 'assigned'
  END as status,
  CASE s.rn
    WHEN 1 THEN 'https://soundcloud.com/example-repost-1'
    WHEN 2 THEN 'https://soundcloud.com/example-repost-2'
    ELSE NULL
  END as proof_url,
  CASE s.rn
    WHEN 1 THEN NOW() - INTERVAL '2 hours'
    WHEN 2 THEN NOW() - INTERVAL '1 hour'
    ELSE NULL
  END as completed_at,
  CASE s.rn
    WHEN 1 THEN NOW() - INTERVAL '2 hours'
    WHEN 2 THEN NOW() - INTERVAL '1 hour'
    ELSE NULL
  END as proof_submitted_at
FROM today_queue tq
CROSS JOIN available_submissions s
LEFT JOIN available_members m ON m.rn = ((s.rn - 1) % 4) + 1
LIMIT 8;

-- Phase 5: Generate assignments for yesterday's published queue
WITH yesterday_queue AS (
  SELECT id as queue_id FROM public.queues WHERE date = CURRENT_DATE - INTERVAL '1 day' LIMIT 1
),
available_members AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY net_credits DESC) as rn 
  FROM public.members 
  WHERE status = 'active' 
  LIMIT 4
),
available_submissions AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn 
  FROM public.submissions 
  WHERE status = 'approved'
  LIMIT 5
)
INSERT INTO public.queue_assignments (
  queue_id, 
  submission_id, 
  supporter_id, 
  position, 
  credits_allocated, 
  status,
  proof_url,
  completed_at,
  proof_submitted_at
)
SELECT 
  yq.queue_id,
  s.id as submission_id,
  m.id as supporter_id,
  s.rn as position,
  CASE s.rn
    WHEN 1 THEN 140
    WHEN 2 THEN 110
    WHEN 3 THEN 90
    WHEN 4 THEN 75
    ELSE 55
  END as credits_allocated,
  CASE s.rn
    WHEN 1 THEN 'completed'
    WHEN 2 THEN 'completed'
    WHEN 3 THEN 'completed'
    WHEN 4 THEN 'skipped'
    ELSE 'completed'
  END as status,
  CASE s.rn
    WHEN 1 THEN 'https://soundcloud.com/yesterday-repost-1'
    WHEN 2 THEN 'https://soundcloud.com/yesterday-repost-2'
    WHEN 3 THEN 'https://soundcloud.com/yesterday-repost-3'
    WHEN 4 THEN NULL
    ELSE 'https://soundcloud.com/yesterday-repost-5'
  END as proof_url,
  CASE s.rn
    WHEN 4 THEN NULL
    ELSE NOW() - INTERVAL '1 day' + INTERVAL '6 hours'
  END as completed_at,
  CASE s.rn
    WHEN 4 THEN NULL
    ELSE NOW() - INTERVAL '1 day' + INTERVAL '6 hours'
  END as proof_submitted_at
FROM yesterday_queue yq
CROSS JOIN available_submissions s
LEFT JOIN available_members m ON m.rn = ((s.rn - 1) % 4) + 1
LIMIT 10;