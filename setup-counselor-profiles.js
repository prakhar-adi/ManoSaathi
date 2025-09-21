// Setup script to create counselor profiles for existing users
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCounselorProfiles() {
  console.log('Setting up counselor profiles...');
  
  try {
    // Get all users with counselor role
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'counselor');

    if (profilesError) throw profilesError;

    console.log(`Found ${profiles.length} counselor profiles`);

    for (const profile of profiles) {
      // Check if counselor profile already exists
      const { data: existingCounselor } = await supabase
        .from('counselor_profiles')
        .select('id')
        .eq('user_id', profile.user_id)
        .single();

      if (!existingCounselor) {
        // Create counselor profile
        const { data: newCounselor, error: createError } = await supabase
          .from('counselor_profiles')
          .insert({
            user_id: profile.user_id,
            name: profile.full_name || 'Dr. ' + profile.email?.split('@')[0] || 'Counselor',
            specialization: ['general-counseling'],
            languages: ['english'],
            experience_years: 1,
            bio: 'Professional counselor providing mental health support to students.',
            hourly_rate: 1500,
            is_active: true
          })
          .select('id')
          .single();

        if (createError) {
          console.error(`Error creating counselor profile for ${profile.email}:`, createError);
        } else {
          console.log(`✅ Created counselor profile for ${profile.email}`);
        }
      } else {
        console.log(`⏭️  Counselor profile already exists for ${profile.email}`);
      }
    }

    console.log('✅ Counselor profile setup completed!');
  } catch (error) {
    console.error('❌ Error setting up counselor profiles:', error);
  }
}

// Run the setup
setupCounselorProfiles();
