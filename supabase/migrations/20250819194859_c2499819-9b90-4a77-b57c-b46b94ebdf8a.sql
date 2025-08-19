-- Create queues table to store daily generated queues
CREATE TABLE public.queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, published
  total_slots INTEGER NOT NULL DEFAULT 0,
  filled_slots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_id UUID,
  approved_by_id UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create queue_assignments table to store individual support assignments
CREATE TABLE public.queue_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  supporter_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  credits_allocated INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'assigned', -- assigned, completed, skipped, failed
  completed_at TIMESTAMP WITH TIME ZONE,
  proof_url TEXT,
  proof_submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(queue_id, position),
  UNIQUE(queue_id, submission_id, supporter_id)
);

-- Enable RLS on queues table
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

-- Enable RLS on queue_assignments table  
ALTER TABLE public.queue_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for queues table
CREATE POLICY "Ops can manage all queues"
ON public.queues
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Members can view published queues"
ON public.queues  
FOR SELECT
USING (status = 'published' OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create policies for queue_assignments table
CREATE POLICY "Ops can manage all queue assignments"
ON public.queue_assignments
FOR ALL  
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Members can view their own assignments"
ON public.queue_assignments
FOR SELECT
USING (
  supporter_id = get_member_id_for_user(auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Members can update their assignment status and proof"
ON public.queue_assignments  
FOR UPDATE
USING (supporter_id = get_member_id_for_user(auth.uid()))
WITH CHECK (supporter_id = get_member_id_for_user(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_queues_date ON public.queues(date);
CREATE INDEX idx_queues_status ON public.queues(status);
CREATE INDEX idx_queue_assignments_queue_id ON public.queue_assignments(queue_id);
CREATE INDEX idx_queue_assignments_supporter_id ON public.queue_assignments(supporter_id);
CREATE INDEX idx_queue_assignments_submission_id ON public.queue_assignments(submission_id);
CREATE INDEX idx_queue_assignments_status ON public.queue_assignments(status);

-- Create trigger for automatic timestamp updates on queues
CREATE TRIGGER update_queues_updated_at
BEFORE UPDATE ON public.queues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on queue_assignments  
CREATE TRIGGER update_queue_assignments_updated_at
BEFORE UPDATE ON public.queue_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();