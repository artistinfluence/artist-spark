-- Fix Critical Security Issues: Enable RLS and Create Policies for All New Tables

-- Fix function security
ALTER FUNCTION public.set_updated_at() SECURITY DEFINER SET search_path = public;

-- Enable RLS on all new tables
ALTER TABLE public.member_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_genres ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.avoid_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repost_credit_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repost_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Member Accounts Policies
CREATE POLICY "Members can view their own accounts" 
  ON public.member_accounts FOR SELECT 
  USING (member_id = get_member_id_for_user(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Ops can manage all member accounts" 
  ON public.member_accounts FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Member Genres Policies  
CREATE POLICY "Members can view their own genre assignments" 
  ON public.member_genres FOR SELECT 
  USING (member_id = get_member_id_for_user(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Ops can manage member genre assignments" 
  ON public.member_genres FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Avoid List Items Policies
CREATE POLICY "Members can manage their own avoid list" 
  ON public.avoid_list_items FOR ALL 
  USING (member_id = get_member_id_for_user(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (member_id = get_member_id_for_user(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Credit Wallet Policies
CREATE POLICY "Members can view their own credit wallet" 
  ON public.repost_credit_wallet FOR SELECT 
  USING (member_id = get_member_id_for_user(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "System can manage credit wallets" 
  ON public.repost_credit_wallet FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Credit Ledger Policies
CREATE POLICY "Members can view their own credit history" 
  ON public.repost_credit_ledger FOR SELECT 
  USING (member_id = get_member_id_for_user(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "System can create credit ledger entries" 
  ON public.repost_credit_ledger FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Ops can view all credit ledger entries" 
  ON public.repost_credit_ledger FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Campaigns Policies
CREATE POLICY "Ops can manage all campaigns" 
  ON public.campaigns FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Target Proposals Policies
CREATE POLICY "Ops can manage target proposals" 
  ON public.target_proposals FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Schedules Policies
CREATE POLICY "Members can view their own schedules" 
  ON public.schedules FOR SELECT 
  USING (
    member_account_id IN (
      SELECT id FROM public.member_accounts 
      WHERE member_id = get_member_id_for_user(auth.uid())
    ) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Members can update their schedule proof" 
  ON public.schedules FOR UPDATE 
  USING (
    member_account_id IN (
      SELECT id FROM public.member_accounts 
      WHERE member_id = get_member_id_for_user(auth.uid())
    )
  )
  WITH CHECK (
    member_account_id IN (
      SELECT id FROM public.member_accounts 
      WHERE member_id = get_member_id_for_user(auth.uid())
    )
  );

CREATE POLICY "Ops can manage all schedules" 
  ON public.schedules FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Attribution Snapshots Policies
CREATE POLICY "Ops can manage attribution snapshots" 
  ON public.attribution_snapshots FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Integration Status Policies
CREATE POLICY "Members can view their own integration status" 
  ON public.integration_status FOR SELECT 
  USING (
    member_account_id IN (
      SELECT id FROM public.member_accounts 
      WHERE member_id = get_member_id_for_user(auth.uid())
    ) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "System can manage integration status" 
  ON public.integration_status FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Automation Templates Policies
CREATE POLICY "Ops can manage automation templates" 
  ON public.automation_templates FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Automation Logs Policies
CREATE POLICY "Members can view their own automation logs" 
  ON public.automation_logs FOR SELECT 
  USING (
    recipient_member_id = get_member_id_for_user(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "System can create automation logs" 
  ON public.automation_logs FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Ops can manage all automation logs" 
  ON public.automation_logs FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));