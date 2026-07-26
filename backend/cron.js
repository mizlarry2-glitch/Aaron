const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/coldemail'
});

/**
 * Resets daily counters at midnight.
 */
async function dailyResetCounters() {
  const client = await pool.connect();
  try {
    await client.query('UPDATE smtp_accounts SET sent_today = 0');
    console.log('Daily counters reset successfully.');
  } catch (error) {
    console.error('Error in dailyResetCounters:', error);
  } finally {
    client.release();
  }
}

/**
 * Resets hourly counters at the top of the hour.
 */
async function hourlyResetCounters() {
  const client = await pool.connect();
  try {
    await client.query('UPDATE smtp_accounts SET sent_this_hour = 0');
    console.log('Hourly counters reset successfully.');
  } catch (error) {
    console.error('Error in hourlyResetCounters:', error);
  } finally {
    client.release();
  }
}

/**
 * Helper to get a random delay between min and max seconds.
 */
function getRandomDelay(minSeconds, maxSeconds) {
  const minMs = minSeconds * 1000;
  const maxMs = maxSeconds * 1000;
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Sleeps for a given number of milliseconds.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Processes due emails for a single SMTP account serially.
 */
async function processAccountQueue(account, minDelay, maxDelay) {
  let hasMore = true;
  let sentThisIteration = 0;

  while (hasMore) {
    // Re-check limits before processing each email
    const client = await pool.connect();
    let currentAccount;
    try {
      const res = await client.query('SELECT sent_today, daily_send_limit, sent_this_hour, hourly_send_limit, status FROM smtp_accounts WHERE id = $1', [account.id]);
      currentAccount = res.rows[0];
    } finally {
      client.release();
    }

    if (!currentAccount || currentAccount.status !== 'active') {
      console.log(`Account ${account.id} is no longer active.`);
      break;
    }

    if (currentAccount.sent_today >= currentAccount.daily_send_limit) {
      console.log(`Account ${account.id} hit daily limit.`);
      break;
    }

    if (currentAccount.hourly_send_limit !== null && currentAccount.sent_this_hour >= currentAccount.hourly_send_limit) {
      console.log(`Account ${account.id} hit hourly limit.`);
      break;
    }

    // Fetch ONE due email to process serially
    const fetchClient = await pool.connect();
    let emailToProcess = null;
    try {
      await fetchClient.query('BEGIN');

      // Select an email that is approved, unsent, and due
      const emailRes = await fetchClient.query(`
        SELECT ge.id, p.sequence_status
        FROM generated_emails ge
        JOIN prospects p ON ge.prospect_id = p.id
        WHERE ge.approved = true
          AND ge.sent = false
          AND (ge.scheduled_send_at IS NULL OR ge.scheduled_send_at <= now())
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      `);

      if (emailRes.rows.length === 0) {
        hasMore = false;
        await fetchClient.query('COMMIT');
        break; // No more emails to send
      }

      emailToProcess = emailRes.rows[0];

      if (emailToProcess.sequence_status !== 'active') {
        // Skip it
        await fetchClient.query(
          'UPDATE generated_emails SET sent = true, skipped_reason = $1 WHERE id = $2',
          ['sequence_stopped', emailToProcess.id]
        );
        await fetchClient.query('COMMIT');
        continue;
      }

      // Simulate sending the email...
      // In reality, use nodemailer here using account credentials

      // Update the email as sent
      await fetchClient.query(
        'UPDATE generated_emails SET sent = true, sent_at = now(), smtp_account_id_used = $1 WHERE id = $2',
        [account.id, emailToProcess.id]
      );

      // Update account counters
      await fetchClient.query(
        'UPDATE smtp_accounts SET sent_today = sent_today + 1, sent_this_hour = sent_this_hour + 1 WHERE id = $1',
        [account.id]
      );

      await fetchClient.query('COMMIT');
      sentThisIteration++;
      console.log(`Email ${emailToProcess.id} sent successfully via account ${account.id}.`);

    } catch (err) {
      await fetchClient.query('ROLLBACK');
      console.error(`Error processing email for account ${account.id}:`, err);
      // Depending on error, we might decrement health_score and pause account here
      break;
    } finally {
      fetchClient.release();
    }

    // Apply the required random pacing delay (30-180 seconds) before sending the next one
    const delay = getRandomDelay(minDelay, maxDelay);
    console.log(`Account ${account.id} waiting ${delay}ms before next send.`);
    await sleep(delay);
  }
}

/**
 * Main scheduler that spawns an independent async loop per active SMTP account.
 */
async function scheduledSender() {
  const minDelay = parseInt(process.env.MIN_DELAY || '30', 10);
  const maxDelay = parseInt(process.env.MAX_DELAY || '180', 10);

  const client = await pool.connect();
  let accounts;
  try {
    const res = await client.query("SELECT id FROM smtp_accounts WHERE status = 'active'");
    accounts = res.rows;
  } catch (error) {
    console.error('Error fetching active accounts:', error);
    client.release();
    return;
  }
  client.release();

  if (accounts.length === 0) {
    console.log('No active SMTP accounts available for sending.');
    return;
  }

  // Spawn an independent processing loop for each account.
  // They run concurrently with respect to each other.
  const promises = accounts.map(account => processAccountQueue(account, minDelay, maxDelay));

  // Wait for all account queues to finish processing their batch
  await Promise.allSettled(promises);
}

module.exports = {
  dailyResetCounters,
  hourlyResetCounters,
  scheduledSender,
  processAccountQueue, // exported for testing
  pool
};
