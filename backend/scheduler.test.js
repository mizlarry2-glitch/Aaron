const cron = require('./cron');

// Mock pg pool
jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  return {
    Pool: jest.fn(() => ({
      connect: jest.fn(() => mClient)
    }))
  };
});

describe('Scheduler Pacing & Logic', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = cron.pool.connect();
    // Re-mock sleep so tests run instantly
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('processAccountQueue stops if account is inactive', async () => {
    mockClient.query.mockResolvedValueOnce({
      rows: [{ status: 'paused', sent_today: 0, daily_send_limit: 10 }]
    });

    await cron.processAccountQueue({ id: 'acc1' }, 0, 0);

    // Only one query was executed to check account status, none to fetch emails
    expect(mockClient.query).toHaveBeenCalledTimes(1);
    expect(mockClient.query.mock.calls[0][0]).toContain('SELECT sent_today');
  });

  it('processAccountQueue stops if daily limit hit', async () => {
    mockClient.query.mockResolvedValueOnce({
      rows: [{ status: 'active', sent_today: 10, daily_send_limit: 10 }]
    });

    await cron.processAccountQueue({ id: 'acc1' }, 0, 0);
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  it('processAccountQueue stops if hourly limit hit', async () => {
    mockClient.query.mockResolvedValueOnce({
      rows: [{
        status: 'active',
        sent_today: 5,
        daily_send_limit: 10,
        sent_this_hour: 2,
        hourly_send_limit: 2
      }]
    });

    await cron.processAccountQueue({ id: 'acc1' }, 0, 0);
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  it('processAccountQueue processes one email and then stops if no more emails', async () => {
    // 1st iteration: Account check
    mockClient.query.mockResolvedValueOnce({
      rows: [{ status: 'active', sent_today: 0, daily_send_limit: 10, sent_this_hour: 0, hourly_send_limit: 10 }]
    });
    // 1st iteration: BEGIN
    mockClient.query.mockResolvedValueOnce();
    // 1st iteration: Fetch email
    mockClient.query.mockResolvedValueOnce({
      rows: [{ id: 'email1', sequence_status: 'active' }]
    });
    // 1st iteration: Update email sent
    mockClient.query.mockResolvedValueOnce();
    // 1st iteration: Update account counters
    mockClient.query.mockResolvedValueOnce();
    // 1st iteration: COMMIT
    mockClient.query.mockResolvedValueOnce();

    // 2nd iteration: Account check
    mockClient.query.mockResolvedValueOnce({
      rows: [{ status: 'active', sent_today: 1, daily_send_limit: 10, sent_this_hour: 1, hourly_send_limit: 10 }]
    });
    // 2nd iteration: BEGIN
    mockClient.query.mockResolvedValueOnce();
    // 2nd iteration: Fetch email (returns empty)
    mockClient.query.mockResolvedValueOnce({
      rows: []
    });
    // 2nd iteration: COMMIT
    mockClient.query.mockResolvedValueOnce();

    await cron.processAccountQueue({ id: 'acc1' }, 0, 0);

    // Assert setTimeout was called (the pacing delay)
    expect(setTimeout).toHaveBeenCalled();
  });
});