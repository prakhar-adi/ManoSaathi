-- Targeted migration script - only creates what's missing
-- Based on your current database state

-- Create counselor profiles table (missing)
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

-- Create counselor availability table (missing)
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

-- Create notifications table (missing)
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

-- Add missing columns to existing counselor_bookings table
DO $$ 
BEGIN
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
END $$;

-- Enable RLS on new tables
ALTER TABLE public.counselor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for counselor_profiles
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

-- Create RLS policies for counselor_availability
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

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Add missing trigger for counselor_profiles (only if it doesn't exist)
DO $$
BEGIN
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
END $$;

-- Note: Sample data insertion removed to avoid foreign key constraint errors
-- The application will work with real authenticated users
-- When a user first accesses the counselor dashboard, a profile will be created automatically
