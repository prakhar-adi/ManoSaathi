# Troubleshooting Guide - ManoSaathi Booking System

## Issue: "Counselor profile not found" Error

### Problem
When trying to save availability in the Weekly Availability section, you get the error:
```
Error saving availability: Error: Counselor profile not found
```

### Root Cause
This error occurs when a user with the "counselor" role doesn't have a corresponding record in the `counselor_profiles` table.

### Solution

#### Option 1: Automatic Fix (Recommended)
The updated code now automatically creates a counselor profile when you try to save availability. Simply:

1. Go to the Counselor Dashboard
2. Navigate to the "Availability" tab
3. Add some time slots for your preferred days
4. Click "Save Weekly Schedule"
5. The system will automatically create your counselor profile and save the availability

#### Option 2: Manual Database Setup
If you prefer to set up counselor profiles manually:

1. **Run the migration** (if not already done):
   ```sql
   -- Run the migration file: 20250120000000_counselor_profiles_and_availability.sql
   ```

2. **Create counselor profiles for existing users**:
   ```sql
   -- For each counselor user, insert a profile
   INSERT INTO counselor_profiles (user_id, name, specialization, languages, experience_years, bio, hourly_rate, is_active)
   VALUES (
     'your-user-id-here',
     'Dr. Your Name',
     ARRAY['general-counseling'],
     ARRAY['english'],
     1,
     'Professional counselor providing mental health support to students.',
     1500,
     true
   );
   ```

#### Option 3: Use the Setup Script
Run the provided setup script:
```bash
node setup-counselor-profiles.js
```

### Verification Steps

1. **Check if your counselor profile exists**:
   ```sql
   SELECT * FROM counselor_profiles WHERE user_id = 'your-user-id';
   ```

2. **Verify RLS policies**:
   Make sure you can insert into counselor_profiles:
   ```sql
   -- This should work if RLS is properly configured
   INSERT INTO counselor_profiles (user_id, name, specialization, languages, experience_years, bio, hourly_rate, is_active)
   VALUES ('test-user-id', 'Test Counselor', ARRAY['general-counseling'], ARRAY['english'], 1, 'Test bio', 1500, true);
   ```

## Common Issues and Solutions

### 1. Database Connection Issues
**Error**: "Failed to load availability" or connection timeouts

**Solution**:
- Check your Supabase credentials in `.env` file
- Verify your Supabase project is active
- Check if the migration has been applied

### 2. RLS Policy Issues
**Error**: "Permission denied" or "Row Level Security" errors

**Solution**:
- Ensure the migration has been applied completely
- Check that your user has the correct role in the `profiles` table
- Verify RLS policies are properly configured

### 3. Time Slot Generation Issues
**Error**: "Error regenerating time slots"

**Solution**:
- Make sure the `create_time_slots_for_date` function exists
- Check that you have availability set before generating time slots
- Verify the function has proper permissions

### 4. Notification Issues
**Error**: Notifications not appearing

**Solution**:
- Check if real-time is enabled in your Supabase project
- Verify the notifications table exists and has proper RLS policies
- Check browser console for subscription errors

## Testing the Fix

After applying the fix:

1. **Login as a counselor**
2. **Go to Counselor Dashboard → Availability tab**
3. **Add time slots for a few days** (e.g., Monday 9 AM - 5 PM)
4. **Click "Save Weekly Schedule"**
5. **You should see**: "Availability saved successfully!"
6. **Check the database**: Your counselor profile should now exist

## Database Schema Verification

Run these queries to verify your setup:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('counselor_profiles', 'counselor_availability', 'counselor_time_slots', 'notifications');

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_time_slots_for_date', 'create_notification', 'handle_booking_creation');

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('counselor_profiles', 'counselor_availability', 'counselor_time_slots', 'notifications');
```

## Getting Help

If you're still experiencing issues:

1. **Check the browser console** for detailed error messages
2. **Check Supabase logs** in your project dashboard
3. **Verify your user role** in the profiles table
4. **Test with a fresh user account** to isolate the issue

## Prevention

To prevent this issue in the future:

1. **Always run migrations** when setting up new environments
2. **Use the automatic profile creation** feature in the updated code
3. **Test the booking flow** after any database changes
4. **Keep the setup script** for quick fixes
