-- Safe migration script that handles existing policies and tables
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
  booking_id UUID REFERENCES public.counselor_bookings(id) ON DELETE SET NULL,
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
            ALTER TABLE public.counselor_bookings ADD COLUMN communication_mode TEXT DEFAULT 'video' CHECK (communication_mode IN ('video', 'audio', 'chat'));
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

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Anyone can view active counselor profiles" ON public.counselor_profiles;
DROP POLICY IF EXISTS "Counselors can view their own profile" ON public.counselor_profiles;
DROP POLICY IF EXISTS "Counselors can insert their own profile" ON public.counselor_profiles;
DROP POLICY IF EXISTS "Counselors can update their own profile" ON public.counselor_profiles;
DROP POLICY IF EXISTS "Admins can manage all counselor profiles" ON public.counselor_profiles;

-- Recreate counselor_profiles policies
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

-- Drop and recreate counselor_availability policies
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

-- Drop and recreate counselor_time_slots policies
DROP POLICY IF EXISTS "Anyone can view available time slots" ON public.counselor_time_slots;
DROP POLICY IF EXISTS "Counselors can manage their own time slots" ON public.counselor_time_slots;
DROP POLICY IF EXISTS "Students can book time slots" ON public.counselor_time_slots;
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

CREATE POLICY "Students can book time slots" ON public.counselor_time_slots
FOR UPDATE USING (
  status = 'available' AND
  EXISTS (
    SELECT 1 FROM public.counselor_bookings 
    WHERE time_slot_id = id AND student_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all time slots" ON public.counselor_time_slots
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Drop and recreate notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Add triggers for updated_at (safe to run multiple times)
CREATE TRIGGER update_counselor_profiles_updated_at
  BEFORE UPDATE ON public.counselor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_counselor_availability_updated_at
  BEFORE UPDATE ON public.counselor_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_counselor_time_slots_updated_at
  BEFORE UPDATE ON public.counselor_time_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create or replace functions (safe to run multiple times)
CREATE OR REPLACE FUNCTION create_time_slots_for_date(target_date DATE)
RETURNS VOID AS $$
DECLARE
  counselor_record RECORD;
  availability_record RECORD;
  slot_start TIME;
  slot_duration INTERVAL := '1 hour';
BEGIN
  -- Loop through all active counselors
  FOR counselor_record IN 
    SELECT id FROM public.counselor_profiles WHERE is_active = true
  LOOP
    -- Loop through their availability for the day of week
    FOR availability_record IN
      SELECT * FROM public.counselor_availability 
      WHERE counselor_id = counselor_record.id 
      AND day_of_week = EXTRACT(DOW FROM target_date)
      AND is_available = true
    LOOP
      slot_start := availability_record.start_time;
      
      -- Create hourly slots
      WHILE slot_start < availability_record.end_time LOOP
        INSERT INTO public.counselor_time_slots (counselor_id, date, start_time, end_time, status)
        VALUES (
          counselor_record.id,
          target_date,
          slot_start,
          slot_start + slot_duration,
          'available'
        )
        ON CONFLICT (counselor_id, date, start_time) DO NOTHING;
        
        slot_start := slot_start + slot_duration;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_booking_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update time slot status to booked
  UPDATE public.counselor_time_slots 
  SET status = 'booked', booking_id = NEW.id
  WHERE id = NEW.time_slot_id;
  
  -- Create notification for counselor
  PERFORM create_notification(
    NEW.counselor_id,
    'booking_request',
    'New Booking Request',
    'You have a new booking request from a student.',
    jsonb_build_object('booking_id', NEW.id, 'student_id', NEW.student_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_booking_status_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If booking is confirmed or rejected, create notification for student
  IF OLD.status != NEW.status AND NEW.status IN ('confirmed', 'rejected') THEN
    PERFORM create_notification(
      NEW.student_id,
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'booking_confirmed'
        WHEN NEW.status = 'rejected' THEN 'booking_rejected'
      END,
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'Booking Confirmed'
        WHEN NEW.status = 'rejected' THEN 'Booking Rejected'
      END,
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'Your booking request has been confirmed by the counselor.'
        WHEN NEW.status = 'rejected' THEN 'Your booking request has been rejected by the counselor.'
      END,
      jsonb_build_object('booking_id', NEW.id, 'counselor_id', NEW.counselor_id)
    );
  END IF;
  
  -- If booking is rejected, make time slot available again
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    UPDATE public.counselor_time_slots 
    SET status = 'available', booking_id = NULL
    WHERE id = NEW.time_slot_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist and recreate them (only if status column exists)
DO $$
BEGIN
    -- Only create triggers if the status column exists in counselor_bookings
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counselor_bookings' AND column_name = 'status') THEN
        DROP TRIGGER IF EXISTS on_booking_created ON public.counselor_bookings;
        DROP TRIGGER IF EXISTS on_booking_status_updated ON public.counselor_bookings;

        CREATE TRIGGER on_booking_created
          AFTER INSERT ON public.counselor_bookings
          FOR EACH ROW EXECUTE FUNCTION handle_booking_creation();

        CREATE TRIGGER on_booking_status_updated
          AFTER UPDATE ON public.counselor_bookings
          FOR EACH ROW EXECUTE FUNCTION handle_booking_status_update();
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

-- Create time slots for the next 30 days
DO $$
DECLARE
  current_date DATE := CURRENT_DATE;
  end_date DATE := CURRENT_DATE + INTERVAL '30 days';
BEGIN
  WHILE current_date <= end_date LOOP
    PERFORM create_time_slots_for_date(current_date);
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END $$;
