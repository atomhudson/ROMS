import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ─────────────────────────────────────────────
const orderCreated   = new Counter('orders_created');
const orderFailed    = new Counter('orders_failed');
const tokenFailed    = new Counter('tokens_failed');
const createDuration = new Trend('order_create_duration', true);
const successRate    = new Rate('success_rate');

// ─── Configuration ──────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Products to randomly pick from
const PRODUCTS = [
  'Wireless Mouse', 'Mechanical Keyboard', 'USB-C Hub', '4K Monitor',
  'Standing Desk', 'Webcam HD', 'Noise-Canceling Headphones', 'Laptop Stand',
  'SSD 1TB', 'RAM 32GB', 'Graphics Card', 'Smart Watch', 'Tablet Pro',
  'Phone Case', 'Bluetooth Speaker', 'Desk Lamp', 'Cable Organizer',
  'Ergonomic Chair', 'Monitor Arm', 'Power Bank',
];

// ─── Load Test Scenarios ────────────────────────────────────────
//
// Run with:  k6 run --env BASE_URL=http://backend:8080 load-test.js
//
// Scenarios (pick via --env SCENARIO=spike|soak|stress, default: standard):
//
//   standard  → ramp to 500 VUs over 1m, hold 3m, ramp down
//   spike     → sudden burst of 1000 VUs
//   stress    → ramp to 2000 VUs progressively
//   soak      → 200 VUs sustained for 10m

const SCENARIO = __ENV.SCENARIO || 'standard';

const scenarios = {
  standard: {
    stages: [
      { duration: '30s', target: 100  },   // warm up
      { duration: '30s', target: 500  },   // ramp to 500
      { duration: '3m',  target: 500  },   // hold at 500
      { duration: '30s', target: 0    },   // cool down
    ],
  },
  spike: {
    stages: [
      { duration: '10s', target: 50   },
      { duration: '5s',  target: 1000 },   // sudden spike
      { duration: '1m',  target: 1000 },   // hold spike
      { duration: '10s', target: 0    },
    ],
  },
  stress: {
    stages: [
      { duration: '1m',  target: 200  },
      { duration: '2m',  target: 500  },
      { duration: '2m',  target: 1000 },
      { duration: '2m',  target: 2000 },   // push limits
      { duration: '1m',  target: 0    },
    ],
  },
  soak: {
    stages: [
      { duration: '30s', target: 200  },
      { duration: '10m', target: 200  },   // sustained load
      { duration: '30s', target: 0    },
    ],
  },
};

export const options = {
  stages: scenarios[SCENARIO]?.stages || scenarios.standard.stages,
  thresholds: {
    http_req_duration:      ['p(95)<2000', 'p(99)<5000'],   // 95% under 2s
    success_rate:           ['rate>0.95'],                    // 95% success
    order_create_duration:  ['p(95)<3000'],                   // order creation < 3s
  },
};

// ─── Per-VU Setup ───────────────────────────────────────────────
// Each VU gets its own dev token (unique user identity)

export function setup() {
  // Verify backend is reachable
  const health = http.get(`${BASE_URL}/actuator/health`);
  if (health.status !== 200) {
    console.error(`Backend not reachable at ${BASE_URL}`);
  }
  return {};
}

// ─── Main Test Function ─────────────────────────────────────────
// Each VU iteration: get token → create order → verify response

export default function () {
  const vuId = __VU;
  const iterId = __ITER;

  // ── Step 1: Get a dev token ──
  const tokenPayload = JSON.stringify({
    name: `LoadUser-${vuId}`,
    email: `loaduser-${vuId}@test.com`,
    role: 'CLIENT',
  });

  const tokenRes = http.post(`${BASE_URL}/dev/token`, tokenPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST /dev/token' },
  });

  const tokenOk = check(tokenRes, {
    'token: status 200': (r) => r.status === 200,
    'token: has token field': (r) => {
      try { return JSON.parse(r.body).token !== undefined; } catch { return false; }
    },
  });

  if (!tokenOk) {
    tokenFailed.add(1);
    successRate.add(false);
    sleep(1);
    return;
  }

  const token = JSON.parse(tokenRes.body).token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // ── Step 2: Create an order ──
  const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
  const price = (Math.random() * 500 + 10).toFixed(2);

  const orderPayload = JSON.stringify({
    productName: product,
    price: parseFloat(price),
  });

  const createRes = http.post(`${BASE_URL}/orders`, orderPayload, {
    headers: authHeaders,
    tags: { name: 'POST /orders' },
  });

  const createOk = check(createRes, {
    'order: status 200': (r) => r.status === 200,
    'order: has id': (r) => {
      try { return JSON.parse(r.body).id !== undefined; } catch { return false; }
    },
    'order: has userId': (r) => {
      try { return JSON.parse(r.body).userId !== undefined; } catch { return false; }
    },
  });

  if (createOk) {
    orderCreated.add(1);
    createDuration.add(createRes.timings.duration);
    successRate.add(true);
  } else {
    orderFailed.add(1);
    successRate.add(false);

    if (iterId < 3) {
      console.warn(`VU ${vuId} order creation failed: ${createRes.status} - ${createRes.body}`);
    }
  }

  // ── Step 3: Fetch orders (verify data) ──
  const listRes = http.get(`${BASE_URL}/orders`, {
    headers: authHeaders,
    tags: { name: 'GET /orders' },
  });

  check(listRes, {
    'list: status 200': (r) => r.status === 200,
    'list: returns array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
    },
  });

  // ── Step 4: Fetch pipeline config (lightweight) ──
  http.get(`${BASE_URL}/api/config/pipeline`, {
    tags: { name: 'GET /api/config/pipeline' },
  });

  // Pace: small random sleep to simulate real user think time
  sleep(Math.random() * 2 + 0.5);
}

// ─── Teardown ───────────────────────────────────────────────────
export function teardown(data) {
  console.log('═══════════════════════════════════════');
  console.log('  Load Test Complete');
  console.log('═══════════════════════════════════════');
}
