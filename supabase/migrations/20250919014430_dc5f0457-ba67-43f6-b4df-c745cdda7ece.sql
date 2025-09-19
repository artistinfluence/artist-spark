-- Create enum type for influence planner status
CREATE TYPE influence_planner_status AS ENUM (
  'hasnt_logged_in',
  'invited', 
  'disconnected',
  'connected',
  'uninterested'
);

-- Add new columns to members table
ALTER TABLE public.members 
ADD COLUMN influence_planner_status influence_planner_status DEFAULT 'hasnt_logged_in',
ADD COLUMN stage_name TEXT,
ADD COLUMN groups TEXT[] DEFAULT '{}';

-- Update existing members with default values
UPDATE public.members 
SET 
  influence_planner_status = 'hasnt_logged_in',
  groups = '{}';

-- Add indexes for better performance
CREATE INDEX idx_members_influence_planner_status ON public.members(influence_planner_status);
CREATE INDEX idx_members_stage_name ON public.members(stage_name);
CREATE INDEX idx_members_groups ON public.members USING GIN(groups);