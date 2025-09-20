-- Add missing fields to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS salesperson_id uuid,
ADD COLUMN IF NOT EXISTS invoice_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS submission_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS date_requested date;

-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients table
CREATE POLICY "Ops can manage all clients" 
ON public.clients 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create updated_at trigger for clients table
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint for campaigns.client_id
ALTER TABLE public.campaigns 
ADD CONSTRAINT fk_campaigns_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id);

-- Add foreign key constraint for campaigns.salesperson_id
ALTER TABLE public.campaigns 
ADD CONSTRAINT fk_campaigns_salesperson_id 
FOREIGN KEY (salesperson_id) REFERENCES auth.users(id);