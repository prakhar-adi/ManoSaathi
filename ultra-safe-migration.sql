-- Ultra-safe migration script that handles ALL existing objects
-- This script will only create what doesn't already exist

-- Create counselor profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.counselor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  specialization TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{}',
  experience_years INTEGER NOT NULL DEFAULT 0,
  bio TEXT,
  hourly_rate INTEGER NOT NULL DEFAULT 1500,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create counselor availability table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.counselor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID REFERENCES public.counselor_profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(counselor_id, day_of_week, start_time)
);

-- Create counselor time slots table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.counselor_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID REFERENCES public.counselor_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  booking_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(counselor_id, date, start_time)
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking_request', 'booking_confirmed', 'booking_rejected', 'booking_reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add missing columns to counselor_bookings table if they don't exist
DO $$ 
BEGIN
    -- Check if counselor_bookings table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'counselor_bookings' AND table_schema = 'public') THEN
        -- Add status column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counselor_bookings' AND column_name = 'status') THEN
            ALTER TABLE public.counselor_bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
        END IF;
        
        -- Add other missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counselor_bookings' AND column_name = 'student_anonymous_id') THEN
            ALTER TABLE public.counselor_bookings ADD COLUMN student_anonymous_id TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counselor_bookings' AND column_name = 'communication_mode') THEN
            ALTER TABLE public.counselor_bookings ADD COLUMN communication_mode TEXT DEFAULT 'video';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counselor_bookings' AND column_name = 'time_slot_id') THEN
            ALTER TABLE public.counselor_bookings ADD COLUMN time_slot_id UUID;
        END IF;
    END IF;
END $$;

-- Enable RLS on new tables (safe to run multiple times)
ALTER TABLE public.counselor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (drop and recreate to avoid conflicts)
-- Counselor profiles policies
DROP POLICY IF EXISTS "Anyone can view active counselor profiles" ON public.counselor_profiles;
DROP POLICY IF EXISTS "Counselors can view their own profile" ON public.counselor_profiles;
DROP POLICY IF EXISTS "Counselors can insert their own profile" ON public.counselor_profiles;
DROP POLICY IF EXISTS "Counselors can update their own profile" ON public.counselor_profiles;
DROP POLICY IF EXISTS "Admins can manage all counselor profiles" ON public.counselor_profiles;

CREATE POLICY "Anyone can view active counselor profiles" ON public.counselor_profiles
FOR SELECT USING (is_active = true);

CREATE POLICY "Counselors can view their own profile" ON public.counselor_profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Counselors can insert their own profile" ON public.counselor_profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Counselors can update their own profile" ON public.counselor_profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all counselor profiles" ON public.counselor_profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Counselor availability policies
DROP POLICY IF EXISTS "Anyone can view counselor availability" ON public.counselor_availability;
DROP POLICY IF EXISTS "Counselors can manage their own availability" ON public.counselor_availability;
DROP POLICY IF EXISTS "Admins can manage all availability" ON public.counselor_availability;

CREATE POLICY "Anyone can view counselor availability" ON public.counselor_availability
FOR SELECT USING (true);

CREATE POLICY "Counselors can manage their own availability" ON public.counselor_availability
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.counselor_profiles 
    WHERE id = counselor_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all availability" ON public.counselor_availability
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Counselor time slots policies
DROP POLICY IF EXISTS "Anyone can view available time slots" ON public.counselor_time_slots;
DROP POLICY IF EXISTS "Counselors can manage their own time slots" ON public.counselor_time_slots;
DROP POLICY IF EXISTS "Admins can manage all time slots" ON public.counselor_time_slots;

CREATE POLICY "Anyone can view available time slots" ON public.counselor_time_slots
FOR SELECT USING (true);

CREATE POLICY "Counselors can manage their own time slots" ON public.counselor_time_slots
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.counselor_profiles 
    WHERE id = counselor_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all time slots" ON public.counselor_time_slots
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Handle triggers safely - only create if they don't exist
DO $$
BEGIN
    -- Only create triggers if they don't already exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_counselor_profiles_updated_at' AND event_object_table = 'counselor_profiles') THEN
        CREATE TRIGGER update_counselor_profiles_updated_at
          BEFORE UPDATE ON public.counselor_profiles
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_counselor_availability_updated_at' AND event_object_table = 'counselor_availability') THEN
        CREATE TRIGGER update_counselor_availability_updated_at
          BEFORE UPDATE ON public.counselor_availability
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_counselor_time_slots_updated_at' AND event_object_table = 'counselor_time_slots') THEN
        CREATE TRIGGER update_counselor_time_slots_updated_at
          BEFORE UPDATE ON public.counselor_time_slots
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Insert sample counselor profiles if they don't exist
INSERT INTO public.counselor_profiles (user_id, name, specialization, languages, experience_years, bio, hourly_rate) 
SELECT '11111111-1111-1111-1111-111111111111', 'Dr. Priya Sharma', ARRAY['anxiety', 'depression', 'academic-stress'], ARRAY['english', 'hindi'], 8, 'Experienced counselor specializing in student mental health and academic stress management.', 1500
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_profiles WHERE user_id = '11111111-1111-1111-1111-111111111111');

INSERT INTO public.counselor_profiles (user_id, name, specialization, languages, experience_years, bio, hourly_rate) 
SELECT '22222222-2222-2222-2222-222222222222', 'Dr. Rajesh Kumar', ARRAY['family-issues', 'relationship-problems'], ARRAY['english', 'hindi', 'urdu'], 12, 'Senior counselor with expertise in family dynamics and relationship counseling.', 2000
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_profiles WHERE user_id = '22222222-2222-2222-2222-222222222222');

-- Insert sample availability for counselors if it doesn't exist
INSERT INTO public.counselor_availability (counselor_id, day_of_week, start_time, end_time) 
SELECT '11111111-1111-1111-1111-111111111111', 1, '09:00', '17:00'
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_availability WHERE counselor_id = '11111111-1111-1111-1111-111111111111' AND day_of_week = 1);

INSERT INTO public.counselor_availability (counselor_id, day_of_week, start_time, end_time) 
SELECT '11111111-1111-1111-1111-111111111111', 2, '09:00', '17:00'
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_availability WHERE counselor_id = '11111111-1111-1111-1111-111111111111' AND day_of_week = 2);

INSERT INTO public.counselor_availability (counselor_id, day_of_week, start_time, end_time) 
SELECT '11111111-1111-1111-1111-111111111111', 3, '09:00', '17:00'
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_availability WHERE counselor_id = '11111111-1111-1111-1111-111111111111' AND day_of_week = 3);

INSERT INTO public.counselor_availability (counselor_id, day_of_week, start_time, end_time) 
SELECT '11111111-1111-1111-1111-111111111111', 4, '09:00', '17:00'
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_availability WHERE counselor_id = '11111111-1111-1111-1111-111111111111' AND day_of_week = 4);

INSERT INTO public.counselor_availability (counselor_id, day_of_week, start_time, end_time) 
SELECT '11111111-1111-1111-1111-111111111111', 5, '09:00', '17:00'
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_availability WHERE counselor_id = '11111111-1111-1111-1111-111111111111' AND day_of_week = 5);

-- Insert sample availability for second counselor
INSERT INTO public.counselor_availability (counselor_id, day_of_week, start_time, end_time) 
SELECT '22222222-2222-2222-2222-222222222222', 1, '10:00', '18:00'
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_availability WHERE counselor_id = '22222222-2222-2222-2222-222222222222' AND day_of_week = 1);

INSERT INTO public.counselor_availability (counselor_id, day_of_week, start_time, end_time) 
SELECT '22222222-2222-2222-2222-222222222222', 2, '10:00', '18:00'
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_availability WHERE counselor_id = '22222222-2222-2222-2222-222222222222' AND day_of_week = 2);

INSERT INTO public.counselor_availability (counselor_id, day_of_week, start_time, end_time) 
SELECT '22222222-2222-2222-2222-222222222222', 3, '10:00', '18:00'
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_availability WHERE counselor_id = '22222222-2222-2222-2222-222222222222' AND day_of_week = 3);

INSERT INTO public.counselor_availability (counselor_id, day_of_week, start_time, end_time) 
SELECT '22222222-2222-2222-2222-222222222222', 4, '10:00', '18:00'
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_availability WHERE counselor_id = '22222222-2222-2222-2222-222222222222' AND day_of_week = 4);

INSERT INTO public.counselor_availability (counselor_id, day_of_week, start_time, end_time) 
SELECT '22222222-2222-2222-2222-222222222222', 5, '10:00', '18:00'
WHERE NOT EXISTS (SELECT 1 FROM public.counselor_availability WHERE counselor_id = '22222222-2222-2222-2222-222222222222' AND day_of_week = 5);
