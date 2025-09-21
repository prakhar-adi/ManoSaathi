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
  screening_type TEXT NOT NULL,
  responses JSONB NOT NULL,
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
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL,
  url TEXT,
  language TEXT NOT NULL DEFAULT 'english',
  risk_level risk_level,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_responses ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role safely
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role::TEXT FROM public.profiles WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);  
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- Screening policies
CREATE POLICY "Users can view own screenings" ON public.screening_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own screenings" ON public.screening_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can view screenings" ON public.screening_responses FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'counselor'));

-- Chat policies  
CREATE POLICY "Users can manage own chats" ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);

-- Booking policies
CREATE POLICY "Students view own bookings" ON public.counselor_bookings FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students create bookings" ON public.counselor_bookings FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Counselors view their bookings" ON public.counselor_bookings FOR SELECT USING (auth.uid() = counselor_id);
CREATE POLICY "Counselors update their bookings" ON public.counselor_bookings FOR UPDATE USING (auth.uid() = counselor_id);
CREATE POLICY "Admins view all bookings" ON public.counselor_bookings FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- Resources policies
CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Admins manage resources" ON public.resources FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Profile creation trigger
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_counselor_bookings_updated_at BEFORE UPDATE ON public.counselor_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sample resources
INSERT INTO public.resources (title, description, content_type, language, risk_level, tags) VALUES
('Mindfulness for Students', 'Basic mindfulness techniques for stress management', 'video', 'english', 'low', ARRAY['mindfulness', 'stress']),
('तनाव प्रबंधन', 'छात्रों के लिए तनाव कम करने की तकनीकें', 'article', 'hindi', 'medium', ARRAY['stress', 'hindi']),
('Crisis Support', 'Immediate help resources for mental health crisis', 'guide', 'english', 'high', ARRAY['crisis', 'emergency']),
('Yoga and Wellness', 'How yoga practices improve mental wellbeing', 'video', 'english', 'low', ARRAY['yoga', 'wellness']),
('ذہنی صحت', 'ذہنی صحت کے بارے میں بنیادی معلومات', 'article', 'urdu', 'medium', ARRAY['mental-health', 'urdu']);