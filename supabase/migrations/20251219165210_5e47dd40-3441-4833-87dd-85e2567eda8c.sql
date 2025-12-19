
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'patient');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'patient',
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Screen texts (editable content for each screen)
CREATE TABLE public.screen_texts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    screen_key TEXT NOT NULL UNIQUE,
    title TEXT,
    content TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.screen_texts ENABLE ROW LEVEL SECURITY;

-- Weekly planning
CREATE TABLE public.weekly_planning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    breakfast TEXT,
    lunch TEXT,
    dinner TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.weekly_planning ENABLE ROW LEVEL SECURITY;

-- Doctor messages
CREATE TABLE public.doctor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT,
    audio_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.doctor_messages ENABLE ROW LEVEL SECURITY;

-- Difficult situations (guides)
CREATE TABLE public.difficult_situations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    tips TEXT[] DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.difficult_situations ENABLE ROW LEVEL SECURITY;

-- Content files (PDFs, videos, audios)
CREATE TABLE public.content_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'video', 'audio', 'text')),
    file_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.content_files ENABLE ROW LEVEL SECURITY;

-- Patient check-ins
CREATE TABLE public.checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    week_rating TEXT,
    difficult_moment TEXT,
    anxiety_level INTEGER CHECK (anxiety_level >= 0 AND anxiety_level <= 10),
    plan_deviations TEXT,
    adjustments_needed TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Check-in questions (editable)
CREATE TABLE public.checkin_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_key TEXT NOT NULL UNIQUE,
    question_text TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.checkin_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User roles: users can see their own roles, admins can see all
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: users can see/edit their own, admins can see all
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Screen texts: everyone can read, admins can edit
CREATE POLICY "Anyone can view screen texts" ON public.screen_texts
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage screen texts" ON public.screen_texts
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Weekly planning: everyone can read, admins can edit
CREATE POLICY "Anyone can view planning" ON public.weekly_planning
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage planning" ON public.weekly_planning
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Doctor messages: everyone can read, admins can edit
CREATE POLICY "Anyone can view messages" ON public.doctor_messages
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage messages" ON public.doctor_messages
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Difficult situations: everyone can read, admins can edit
CREATE POLICY "Anyone can view situations" ON public.difficult_situations
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage situations" ON public.difficult_situations
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Content files: everyone can read, admins can edit
CREATE POLICY "Anyone can view files" ON public.content_files
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage files" ON public.content_files
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Checkins: users can manage their own, admins can view all
CREATE POLICY "Users can manage own checkins" ON public.checkins
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all checkins" ON public.checkins
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Checkin questions: everyone can read, admins can edit
CREATE POLICY "Anyone can view questions" ON public.checkin_questions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage questions" ON public.checkin_questions
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updating profiles on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
    
    -- By default, new users are patients (admin must be set manually)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'patient');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_screen_texts_updated_at BEFORE UPDATE ON public.screen_texts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_updated_at BEFORE UPDATE ON public.weekly_planning
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.doctor_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_situations_updated_at BEFORE UPDATE ON public.difficult_situations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.content_files
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.checkin_questions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
