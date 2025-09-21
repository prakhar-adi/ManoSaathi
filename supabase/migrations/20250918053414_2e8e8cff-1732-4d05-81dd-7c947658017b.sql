-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('student', 'admin', 'counselor');

-- Create risk level enum
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create screening responses table
CREATE TABLE public.screening_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  screening_type TEXT NOT NULL, -- 'phq9' or 'gad7'
  responses JSONB NOT NULL, -- Array of response values
  total_score INTEGER NOT NULL,
  risk_level risk_level NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create counselor bookings table
CREATE TABLE public.counselor_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  counselor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL, -- 'video', 'audio', 'article', 'guide'
  url TEXT,
  language TEXT NOT NULL DEFAULT 'english', -- 'english', 'hindi', 'urdu'
  risk_level risk_level, -- Resources can be targeted to specific risk levels
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for screening responses
CREATE POLICY "Users can view their own screening responses" ON public.screening_responses
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own screening responses" ON public.screening_responses
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Counselors and admins can view screening responses" ON public.screening_responses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'counselor')
  )
);

-- RLS Policies for chat sessions
CREATE POLICY "Users can manage their own chat sessions" ON public.chat_sessions
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for counselor bookings
CREATE POLICY "Students can view their own bookings" ON public.counselor_bookings
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create bookings" ON public.counselor_bookings
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Counselors can view their bookings" ON public.counselor_bookings
FOR SELECT USING (auth.uid() = counselor_id);

CREATE POLICY "Counselors can update their bookings" ON public.counselor_bookings
FOR UPDATE USING (auth.uid() = counselor_id);

CREATE POLICY "Admins can view all bookings" ON public.counselor_bookings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for resources (public read access)
CREATE POLICY "Anyone can view resources" ON public.resources
FOR SELECT USING (true);

CREATE POLICY "Admins can manage resources" ON public.resources
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_counselor_bookings_updated_at
  BEFORE UPDATE ON public.counselor_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample resources
INSERT INTO public.resources (title, description, content_type, language, risk_level, tags) VALUES
('Mindfulness for Students', 'Basic mindfulness techniques for stress management', 'video', 'english', 'low', ARRAY['mindfulness', 'stress', 'meditation']),
('तनाव प्रबंधन तकनीकें', 'छात्रों के लिए तनाव कम करने की तकनीकें', 'article', 'hindi', 'medium', ARRAY['stress', 'hindi']),
('Crisis Support Resources', 'Immediate help resources for mental health crisis', 'guide', 'english', 'high', ARRAY['crisis', 'emergency']),
('Yoga and Mental Health', 'How yoga practices can improve mental wellbeing', 'video', 'english', 'low', ARRAY['yoga', 'wellness']),
('آپ کی ذہنی صحت', 'ذہنی صحت کے بارے میں بنیادی معلومات', 'article', 'urdu', 'medium', ARRAY['mental-health', 'urdu']);

-- Insert sample counselor profiles
INSERT INTO auth.users (id, email) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'counselor1@manosaathi.com'),
  ('22222222-2222-2222-2222-222222222222', 'admin@manosaathi.com');

INSERT INTO public.profiles (user_id, email, full_name, role, phone) VALUES
('11111111-1111-1111-1111-111111111111', 'counselor1@manosaathi.com', 'Dr. Priya Sharma', 'counselor', '+91-9876543210'),
('22222222-2222-2222-2222-222222222222', 'admin@manosaathi.com', 'Admin User', 'admin', '+91-9876543211');