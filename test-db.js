// Simple test script to verify database connection and schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
    
    // Test counselor_profiles table
    const { data: counselors, error: counselorError } = await supabase
      .from('counselor_profiles')
      .select('*')
      .limit(1);
    
    if (counselorError) {
      console.log('❌ counselor_profiles table not found or accessible');
      console.log('Error:', counselorError.message);
    } else {
      console.log('✅ counselor_profiles table accessible');
    }
    
    // Test counselor_availability table
    const { data: availability, error: availabilityError } = await supabase
      .from('counselor_availability')
      .select('*')
      .limit(1);
    
    if (availabilityError) {
      console.log('❌ counselor_availability table not found or accessible');
      console.log('Error:', availabilityError.message);
    } else {
      console.log('✅ counselor_availability table accessible');
    }
    
    // Test counselor_time_slots table
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('counselor_time_slots')
      .select('*')
      .limit(1);
    
    if (timeSlotsError) {
      console.log('❌ counselor_time_slots table not found or accessible');
      console.log('Error:', timeSlotsError.message);
    } else {
      console.log('✅ counselor_time_slots table accessible');
    }
    
    // Test notifications table
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (notificationsError) {
      console.log('❌ notifications table not found or accessible');
      console.log('Error:', notificationsError.message);
    } else {
      console.log('✅ notifications table accessible');
    }
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  }
}

testDatabase();
