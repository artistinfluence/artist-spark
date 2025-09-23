-- Make supporter fields nullable in campaign_receipt_links table
ALTER TABLE public.campaign_receipt_links 
ALTER COLUMN supporter_name DROP NOT NULL,
ALTER COLUMN supporter_handle DROP NOT NULL;