-- Function to create time slots from availability
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
