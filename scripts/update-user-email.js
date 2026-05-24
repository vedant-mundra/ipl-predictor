const { createClient } = require('@supabase/supabase-js');

// Configuration - Ensure these are set in your environment
const SUPABASE_URL = 'https://euwyvgywckmwlzofotfv.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
  console.log('Usage: $env:SUPABASE_SERVICE_ROLE_KEY="your-key"; node scripts/update-user-email.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateUserEmail() {
  const userId = 'eb26291f-7f75-4a53-8fc9-3018d0b9d14b';
  const currentEmail = 'vdnsid@gmail.com';
  const newEmail = 'vednsid@gmail.com';

  console.log(`--- Supabase User Email Update ---`);
  console.log(`User ID:      ${userId}`);
  console.log(`Current:      ${currentEmail}`);
  console.log(`New Email:    ${newEmail}`);
  console.log(`----------------------------------`);

  try {
    // 1. Update the user's email and mark as confirmed in one atomic operation
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { 
        email: newEmail,
        email_confirm: true // This keeps the email marked as verified
      }
    );

    if (error) {
      if (error.message.includes('already exists')) {
        console.error(`\n❌ ERROR: The email "${newEmail}" is already in use by another account.`);
      } else {
        console.error(`\n❌ ERROR: ${error.message}`);
      }
      return;
    }

    // 2. Verification
    console.log(`\n✅ SUCCESS: User email updated successfully!`);
    console.log(`Updated User: ${data.user.email}`);
    console.log(`Verified At:  ${data.user.email_confirmed_at}`);
    console.log(`\nAll linked data for User ID ${userId} remains intact.`);
    console.log(`User can now log in with: ${newEmail}`);

  } catch (err) {
    console.error(`\n❌ UNEXPECTED ERROR:`, err.message);
  }
}

updateUserEmail();
