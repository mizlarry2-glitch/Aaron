const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth Routes (Login to get JWT)
app.post('/auth/login', (req, res) => {
  // TODO: Implement actual login logic
  res.status(501).json({ error: 'Not Implemented' });
});

// SMTP Accounts
app.post('/smtp-accounts/test', (req, res) => {
  // TODO: Implement test logic (enforce port 587/465)
  res.status(501).json({ error: 'Not Implemented' });
});

// Emails
app.post('/emails/generate', (req, res) => {
  // TODO: Implement Mode A generation
  res.status(501).json({ error: 'Not Implemented' });
});

app.post('/steps/:stepId/approve-as-pattern', (req, res) => {
  // TODO: Implement approve as pattern logic
  res.status(501).json({ error: 'Not Implemented' });
});

app.post('/steps/:stepId/propagate', (req, res) => {
  // TODO: Implement Mode B propagation
  res.status(501).json({ error: 'Not Implemented' });
});

app.post('/emails/manual', (req, res) => {
  // TODO: Implement Mode C manual entry
  res.status(501).json({ error: 'Not Implemented' });
});

app.post('/emails/batch-approve', (req, res) => {
  // TODO: Implement batch approval
  res.status(501).json({ error: 'Not Implemented' });
});

// Tracking Endpoints (Public)
app.get('/track/open/:id', (req, res) => {
  // TODO: Record open and serve pixel
  res.status(501).send('Not Implemented');
});

app.get('/track/click/:id', (req, res) => {
  // TODO: Record click and redirect
  res.status(501).send('Not Implemented');
});

// Optional: Scraper
app.post('/scrape-url', (req, res) => {
  // TODO: Implement generic text scraping
  res.status(501).json({ error: 'Not Implemented' });
});


// Avoid listening during testing
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
