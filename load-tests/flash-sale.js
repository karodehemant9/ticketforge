import http from 'k6/http';
import { check, sleep } from 'k6';

// Flash sale simulation: 100 users trying to buy same ticket simultaneously
export const options = {
  stages: [
    { duration: '10s', target: 50 },   // Ramp up
    { duration: '30s', target: 100 }, // Peak load
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<<0.1'],     // Less than 10% errors
  },
};

const BASE_URL = 'http://localhost:5000/api/v1';

export default function () {
  // 1. Login to get token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'loadtest@ticketforge.com',
    password: 'LoadTest123!',
  }), { headers: { 'Content-Type': 'application/json' } });

  if (loginRes.status !== 200) {
    console.log('Login failed:', loginRes.body);
    return;
  }

  const token = loginRes.json('data.tokens.accessToken');

  // 2. Add to cart (simulating flash sale rush)
  const cartRes = http.post(`${BASE_URL}/bookings/cart`, JSON.stringify({
    eventId: 'REPLACE_WITH_REAL_EVENT_ID',
    pricingId: 'REPLACE_WITH_REAL_PRICING_ID',
    quantity: 1,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  check(cartRes, {
    'cart status is 200 or 409': (r) => r.status === 200 || r.status === 409,
    'response has success': (r) => r.json('success') !== undefined,
  });

  sleep(1);
}