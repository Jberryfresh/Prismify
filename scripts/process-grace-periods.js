/**
 * Grace Period Processing Cron Job
 *
 * This script should be run daily (recommended time: 9:00 AM UTC) to:
 * - Check users with past_due subscriptions
 * - Send dunning emails (Day 3, Day 7)
 * - Suspend access for users whose grace period has expired
 *
 * Usage:
 * - node scripts/process-grace-periods.js
 * - Schedule with cron: 0 9 * * * node /path/to/scripts/process-grace-periods.js
 * - Or use Vercel Cron Jobs, AWS EventBridge, or similar
 *
 * @module scripts/process-grace-periods
 */

import dotenv from 'dotenv';
import subscriptionManager from '../src/services/subscriptionManager.js';

// Load environment variables
dotenv.config();

/**
 * Main execution function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Grace Period Processing - Starting');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    // Process grace periods
    const summary = await subscriptionManager.processGracePeriods();

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('Grace Period Processing - Complete');
    console.log('='.repeat(60));
    console.log('Summary:');
    console.log(`  Users checked: ${summary.checked}`);
    console.log(`  Day 3 dunning emails sent: ${summary.day3Emails}`);
    console.log(`  Day 7 warning emails sent: ${summary.day7Emails}`);
    console.log(`  Subscriptions suspended (grace period expired): ${summary.expired}`);
    console.log(`  Errors: ${summary.errors.length}`);

    if (summary.errors.length > 0) {
      console.log('\nErrors encountered:');
      summary.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. User ${err.userId}: ${err.error}`);
      });
    }

    // Get subscription summary
    console.log('\n' + '='.repeat(60));
    console.log('Current Subscription Summary');
    console.log('='.repeat(60));
    const subscriptionSummary = await subscriptionManager.getSubscriptionSummary();
    console.log('By Status:');
    Object.entries(subscriptionSummary.byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log(`\nGrace Period Stats:`);
    console.log(`  Currently in grace period: ${subscriptionSummary.inGracePeriod}`);
    console.log(
      `  Grace period expired (needs manual attention): ${subscriptionSummary.expiredGracePeriod}`
    );

    console.log('\n' + '='.repeat(60));
    console.log('Process completed successfully');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('ERROR: Grace period processing failed');
    console.error('='.repeat(60));
    console.error(error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
