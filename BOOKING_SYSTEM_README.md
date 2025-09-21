# ManoSaathi Booking System Implementation

## Overview

This document describes the complete implementation of the "Book Counselor" feature for the ManoSaathi digital mental health platform. The system allows students to book counseling sessions with qualified mental health professionals.

## Features Implemented

### 1. Anonymous/Campus ID Selection
- **Location**: `src/pages/BookingEntry.tsx`
- **Features**:
  - Choice between campus ID and anonymous booking
  - Privacy guidelines and terms
  - Session storage for booking preferences

### 2. Counselor Selection with Filters
- **Location**: `src/pages/CounselorSelection.tsx`
- **Features**:
  - List of registered counselors from `counselor_profiles` table
  - Filter by specialization (anxiety, depression, academic-stress, etc.)
  - Filter by language (English, Hindi, Urdu)
  - Search functionality
  - Counselor details including experience, bio, and rates

### 3. Real-time Availability System
- **Location**: `src/pages/BookingAvailability.tsx`
- **Features**:
  - Real-time slot fetching from `counselor_time_slots` table
  - Weekly calendar view
  - Disabled past and booked slots
  - Visual indicators for slot status (available/booked/blocked)

### 4. Comprehensive Booking Form
- **Location**: `src/pages/BookingForm.tsx`
- **Features**:
  - Auto-populated student ID
  - Anonymous ID generation for anonymous bookings
  - Communication mode selection (video/audio/chat)
  - Optional reason for session
  - Form validation
  - Integration with `counselor_bookings` table

### 5. Notification System
- **Location**: `src/components/NotificationSystem.tsx`
- **Features**:
  - Real-time notifications for booking requests
  - Status updates (confirmed/rejected)
  - Unread count badge
  - Notification history
  - Integration with `notifications` table

### 6. Counselor Dashboard
- **Location**: `src/pages/CounselorDashboard.tsx`
- **Features**:
  - Session statistics and analytics
  - Booking request management
  - High-risk student alerts
  - Availability management integration

### 7. Availability Management
- **Location**: `src/components/CounselorAvailabilityManager.tsx`
- **Features**:
  - Weekly schedule management
  - Specific date slot blocking/unblocking
  - Time slot regeneration
  - Integration with `counselor_availability` and `counselor_time_slots` tables

### 8. Booking Success Page
- **Location**: `src/pages/BookingSuccess.tsx`
- **Features**:
  - Booking confirmation details
  - Next steps guidance
  - Session information display
  - Navigation options

## Database Schema

### New Tables Created

#### 1. `counselor_profiles`
```sql
CREATE TABLE counselor_profiles (
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
```

#### 2. `counselor_availability`
```sql
CREATE TABLE counselor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID REFERENCES counselor_profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(counselor_id, day_of_week, start_time)
);
```

#### 3. `counselor_time_slots`
```sql
CREATE TABLE counselor_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID REFERENCES counselor_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  booking_id UUID REFERENCES counselor_bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(counselor_id, date, start_time)
);
```

#### 4. `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking_request', 'booking_confirmed', 'booking_rejected', 'booking_reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### Modified Tables

#### `counselor_bookings` (Enhanced)
Added columns:
- `student_anonymous_id TEXT`
- `communication_mode TEXT DEFAULT 'video'`
- `time_slot_id UUID REFERENCES counselor_time_slots(id)`

## Key Functions and Triggers

### 1. `create_time_slots_for_date(target_date DATE)`
- Generates hourly time slots for a specific date based on counselor availability
- Called automatically when availability is updated

### 2. `handle_booking_creation()`
- Trigger function that runs when a new booking is created
- Updates time slot status to 'booked'
- Creates notification for counselor

### 3. `handle_booking_status_update()`
- Trigger function that runs when booking status is updated
- Creates notifications for students
- Manages time slot availability

### 4. `create_notification()`
- Helper function to create notifications
- Used by trigger functions

## Row Level Security (RLS) Policies

All tables have appropriate RLS policies implemented:
- Users can only access their own data
- Counselors can manage their own profiles and availability
- Students can view available counselors and book sessions
- Admins have full access to all data

## Real-time Features

### 1. Live Notifications
- Uses Supabase real-time subscriptions
- Automatic updates when booking status changes
- Real-time notification badges

### 2. Availability Updates
- Time slots update in real-time
- Automatic slot generation based on availability changes
- Live booking status updates

## Usage Flow

### For Students:
1. Click "Book Session" in navigation
2. Choose anonymous or campus ID booking
3. Browse and filter counselors
4. Select available time slot
5. Fill booking form
6. Receive confirmation and notifications

### For Counselors:
1. Access counselor dashboard
2. Manage weekly availability
3. Block/unblock specific time slots
4. Review and respond to booking requests
5. Update booking status (confirm/reject)
6. View session analytics

## Error Handling

- Graceful fallbacks to mock data when database is unavailable
- Comprehensive error messages for users
- Console logging for debugging
- Form validation with user-friendly messages

## Security Features

- Row Level Security on all tables
- User authentication required for booking
- Anonymous booking option for privacy
- Secure session storage for booking data
- Input validation and sanitization

## Testing

To test the system:

1. **Database Setup**: Run the migration file `20250120000000_counselor_profiles_and_availability.sql`
2. **Development Server**: Run `npm run dev`
3. **Test Database**: Run `node test-db.js` to verify database connectivity
4. **User Flow**: Test the complete booking flow from student and counselor perspectives

## Future Enhancements

- Payment integration
- Video conferencing integration
- Session recording and notes
- Advanced analytics and reporting
- Mobile app support
- Multi-language UI support

## Troubleshooting

### Common Issues:

1. **Database Connection**: Ensure Supabase credentials are correctly set in environment variables
2. **RLS Policies**: Verify that RLS policies are properly configured
3. **Real-time**: Check that real-time subscriptions are enabled in Supabase
4. **Time Zones**: Ensure proper time zone handling for appointments

### Debug Steps:

1. Check browser console for errors
2. Verify database tables exist and have correct schema
3. Test RLS policies with different user roles
4. Check Supabase logs for server-side errors

## Support

For issues or questions regarding the booking system implementation, please refer to the code comments and this documentation. The system is designed to be robust and user-friendly while maintaining security and privacy standards.
