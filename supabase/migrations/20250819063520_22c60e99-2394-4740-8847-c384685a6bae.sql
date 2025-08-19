-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for type safety
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'member');
CREATE TYPE member_status AS ENUM ('active', 'needs_reconnect');
CREATE TYPE size_tier AS ENUM ('T1', 'T2', 'T3', 'T4');
CREATE TYPE submission_status AS ENUM ('new', 'approved', 'rejected');
CREATE TYPE inquiry_status AS ENUM ('undecided', 'admitted', 'rejected');
CREATE TYPE complaint_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE target_band_mode AS ENUM ('balance', 'size');

-- User roles table for RBAC
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Genre taxonomy tables
CREATE TABLE public.genre_families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.subgenres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.genre_families(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    patterns TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (family_id, name)
);

-- Members table
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    followers INTEGER DEFAULT 0,
    size_tier size_tier DEFAULT 'T1',
    families TEXT[] DEFAULT '{}',
    subgenres TEXT[] DEFAULT '{}',
    emails TEXT[] DEFAULT '{}' CHECK (array_length(emails, 1) <= 5),
    primary_email TEXT,
    status member_status DEFAULT 'active',
    last_submission_at TIMESTAMP WITH TIME ZONE,
    
    -- Limits and fairness
    monthly_submission_limit INTEGER DEFAULT 4,
    submissions_this_month INTEGER DEFAULT 0,
    monthly_credit_limit INTEGER DEFAULT 1000,
    reach_factor DECIMAL(4,3) DEFAULT 0.060,
    credits_given INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    net_credits INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Submissions table
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    track_url TEXT NOT NULL,
    artist_name TEXT,
    subgenres TEXT[] DEFAULT '{}',
    family TEXT,
    status submission_status DEFAULT 'new',
    support_date DATE,
    support_url TEXT,
    need_live_link BOOLEAN DEFAULT false,
    suggested_supporters UUID[] DEFAULT '{}',
    expected_reach_min INTEGER DEFAULT 0,
    expected_reach_max INTEGER DEFAULT 0,
    expected_reach_planned INTEGER DEFAULT 0,
    qa_flag BOOLEAN DEFAULT false,
    qa_reason TEXT,
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    owner_id UUID REFERENCES auth.users(id),
    resend_message_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Membership inquiries table
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    soundcloud_url TEXT,
    status inquiry_status DEFAULT 'undecided',
    admitted_group TEXT,
    admitted_at TIMESTAMP WITH TIME ZONE,
    member_id UUID REFERENCES public.members(id),
    ip_join_confirmed BOOLEAN DEFAULT false,
    notes TEXT,
    owner_id UUID REFERENCES auth.users(id),
    resend_message_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Complaints table
CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    song_url TEXT,
    notes TEXT,
    status complaint_status DEFAULT 'todo',
    owner_id UUID REFERENCES auth.users(id),
    ack_sent_at TIMESTAMP WITH TIME ZONE,
    resend_message_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mail events table for tracking email delivery
CREATE TABLE public.mail_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id TEXT NOT NULL,
    object_type TEXT NOT NULL CHECK (object_type IN ('submission', 'inquiry', 'complaint', 'member')),
    object_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    meta JSONB DEFAULT '{}'
);

-- Settings table (singleton)
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_sla_hours INTEGER DEFAULT 24,
    proof_sla_hours INTEGER DEFAULT 24,
    inactivity_days INTEGER DEFAULT 90,
    preview_cache_days INTEGER DEFAULT 30,
    default_reach_factor DECIMAL(4,3) DEFAULT 0.060,
    target_band_mode target_band_mode DEFAULT 'balance',
    size_tier_thresholds JSONB DEFAULT '{"T1": {"min": 0, "max": 1000}, "T2": {"min": 1000, "max": 10000}, "T3": {"min": 10000, "max": 100000}, "T4": {"min": 100000, "max": 999999999}}',
    adjacency_matrix JSONB DEFAULT '{}',
    slack_enabled BOOLEAN DEFAULT false,
    slack_webhook TEXT,
    slack_channel TEXT DEFAULT '#soundcloud-groups',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings
INSERT INTO public.settings (id) VALUES (gen_random_uuid());

-- Create indexes for performance
CREATE INDEX idx_members_emails ON public.members USING GIN(emails);
CREATE INDEX idx_members_status ON public.members(status);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_member_id ON public.submissions(member_id);
CREATE INDEX idx_submissions_support_date ON public.submissions(support_date);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_mail_events_message_id ON public.mail_events(message_id);
CREATE INDEX idx_mail_events_object ON public.mail_events(object_type, object_id);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genre_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subgenres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper function to get current user's member ID
CREATE OR REPLACE FUNCTION public.get_member_id_for_user(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.members 
  WHERE _user_id::text = ANY(emails)
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for genre_families (readable by all authenticated users)
CREATE POLICY "Authenticated users can view genre families" ON public.genre_families
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Admins can manage genre families" ON public.genre_families
    FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for subgenres
CREATE POLICY "Authenticated users can view subgenres" ON public.subgenres
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Admins can manage subgenres" ON public.subgenres
    FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for members
CREATE POLICY "Members can view their own data" ON public.members
    FOR SELECT TO authenticated 
    USING (
        auth.uid()::text = ANY(emails) OR 
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'moderator')
    );

CREATE POLICY "Ops can manage all members" ON public.members
    FOR ALL TO authenticated 
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'moderator')
    )
    WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'moderator')
    );

-- RLS Policies for submissions
CREATE POLICY "Members can view their own submissions" ON public.submissions
    FOR SELECT TO authenticated 
    USING (
        public.get_member_id_for_user(auth.uid()) = member_id OR
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'moderator')
    );

CREATE POLICY "Members can create their own submissions" ON public.submissions
    FOR INSERT TO authenticated 
    WITH CHECK (public.get_member_id_for_user(auth.uid()) = member_id);

CREATE POLICY "Ops can manage all submissions" ON public.submissions
    FOR ALL TO authenticated 
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'moderator')
    )
    WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'moderator')
    );

-- RLS Policies for inquiries
CREATE POLICY "Ops can manage all inquiries" ON public.inquiries
    FOR ALL TO authenticated 
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'moderator')
    )
    WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'moderator')
    );

-- RLS Policies for complaints
CREATE POLICY "Ops can manage all complaints" ON public.complaints
    FOR ALL TO authenticated 
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'moderator')
    )
    WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'moderator')
    );

-- RLS Policies for mail_events (read-only for ops)
CREATE POLICY "Ops can view mail events" ON public.mail_events
    FOR SELECT TO authenticated 
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'moderator')
    );

-- RLS Policies for settings (admin only)
CREATE POLICY "Admins can manage settings" ON public.settings
    FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger functions for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_genre_families_updated_at BEFORE UPDATE ON public.genre_families FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_subgenres_updated_at BEFORE UPDATE ON public.subgenres FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Insert some default genre families for testing
INSERT INTO public.genre_families (name) VALUES 
    ('Electronic'),
    ('Hip-Hop'),
    ('Rock'),
    ('Pop'),
    ('R&B');