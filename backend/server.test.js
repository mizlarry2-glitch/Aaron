const request = require('supertest');
const app = require('./server');

describe('Server', () => {
  it('should respond to /health', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});