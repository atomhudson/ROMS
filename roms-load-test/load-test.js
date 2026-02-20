import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ─────────────────────────────────────────────
const ordersCreated      = new Counter('orders_created');
const ordersUpdated      = new Counter('orders_updated');
const ordersFetched      = new Counter('orders_fetched');
const webhookTriggered   = new Counter('webhook_triggered');
const failures           = new Counter('failures');
const tokenFailed        = new Counter('tokens_failed');
const createDuration     = new Trend('order_create_duration', true);
const updateDuration     = new Trend('order_update_duration', true);
const fetchDuration      = new Trend('order_fetch_duration', true);
const webhookDuration    = new Trend('webhook_duration', true);
const successRate        = new Rate('success_rate');

// ─── Configuration ──────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Action weights (must sum to 1.0)
const ACTION_CREATE_WEIGHT = 0.60;   // 60% create
const ACTION_UPDATE_WEIGHT = 0.30;   // 30% update status
// remaining 10% → fetch by ID

// Webhook trigger probability after create/update
const WEBHOOK_PROBABILITY = 0.5;

// Products to randomly pick from
const PRODUCTS = [
  'Wireless Mouse', 'Mechanical Keyboard', 'USB-C Hub', '4K Monitor',
  'Standing Desk', 'Webcam HD', 'Noise-Canceling Headphones', 'Laptop Stand',
  'SSD 1TB', 'RAM 32GB', 'Graphics Card', 'Smart Watch', 'Tablet Pro',
  'Phone Case', 'Bluetooth Speaker', 'Desk Lamp', 'Cable Organizer',
  'Ergonomic Chair', 'Monitor Arm', 'Power Bank',
];

// Order pipeline statuses (from application.properties)
// Non-terminal flow: CREATED → PROCESSING → PROCESSED → SHIPPED → IN_TRANSIT → OUT_FOR_DELIVER → DELIVERED
// Terminal states: DELIVERED, CANCELED
const PIPELINE_FLOW = [
  'CREATED',
  'PROCESSING',
  'PROCESSED',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVER',
  'DELIVERED',
];
const TERMINAL_CANCEL = 'CANCELED';

// ─── Per-VU State ───────────────────────────────────────────────
// Each VU maintains its own map of orderId → current status.
// k6 runs each VU as an independent JS runtime — no shared state.
const vuOrders = {};   // { orderId: currentStatus }

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
    order_create_duration:  ['p(95)<3000'],                   // creation < 3s
    order_update_duration:  ['p(95)<3000'],                   // update   < 3s
    webhook_duration:       ['p(95)<2000'],                   // webhook  < 2s
  },
};

// ─── Setup ──────────────────────────────────────────────────────
export function setup() {
  const health = http.get(`${BASE_URL}/actuator/health`);
  if (health.status !== 200) {
    console.error(`Backend not reachable at ${BASE_URL}`);
  }
  return {};
}

// ─── Helpers ────────────────────────────────────────────────────

function randomProduct() {
  return PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
}

function randomPrice() {
  return parseFloat((Math.random() * 500 + 10).toFixed(2));
}

/**
 * Compute the next realistic status for an order.
 * 80% → advance to the next pipeline step
 * 20% → cancel the order (terminal)
 */
function nextStatus(currentStatus) {
  const idx = PIPELINE_FLOW.indexOf(currentStatus);

  // Already terminal (DELIVERED) or unknown → restart at PROCESSING
  if (idx < 0 || idx >= PIPELINE_FLOW.length - 1) {
    return 'PROCESSING';
  }

  // 20% chance to cancel instead of advancing
  if (Math.random() < 0.2) {
    return TERMINAL_CANCEL;
  }

  return PIPELINE_FLOW[idx + 1];
}

function pickRandomOrder() {
  const ids = Object.keys(vuOrders);
  if (ids.length === 0) return null;
  const id = ids[Math.floor(Math.random() * ids.length)];
  return { id, status: vuOrders[id] };
}

function thinkTime() {
  sleep(Math.random() * 2.5 + 0.5);   // 0.5s – 3s
}

// ─── Action: Create Order ───────────────────────────────────────

function doCreateOrder(authHeaders, vuId, iterId) {
  const orderPayload = JSON.stringify({
    productName: randomProduct(),
    price: randomPrice(),
  });

  const res = http.post(`${BASE_URL}/orders`, orderPayload, {
    headers: authHeaders,
    tags: { name: 'POST /orders' },
  });

  const ok = check(res, {
    'create: status 202':  (r) => r.status === 202,
    'create: has id':      (r) => {
      try { return JSON.parse(r.body).id !== undefined; } catch { return false; }
    },
    'create: has userId':  (r) => {
      try { return JSON.parse(r.body).userId !== undefined; } catch { return false; }
    },
  });

  if (ok) {
    const order = JSON.parse(res.body);
    vuOrders[order.id] = order.status;   // track status per order
    ordersCreated.add(1);
    createDuration.add(res.timings.duration);
    successRate.add(true);
    return order;
  }

  failures.add(1);
  successRate.add(false);
  if (iterId < 3) {
    console.warn(`VU ${vuId} create failed: ${res.status} – ${res.body}`);
  }
  return null;
}

// ─── Action: Update Order Status ────────────────────────────────
// Uses: PUT /orders/{id}/status?status=NEW_STATUS
// Advances the order through the real pipeline:
// CREATED → PROCESSING → PROCESSED → SHIPPED → IN_TRANSIT → OUT_FOR_DELIVER → DELIVERED
// or randomly cancels (20%).

function doUpdateStatus(authHeaders, vuId, iterId) {
  const picked = pickRandomOrder();

  // No orders exist yet → fallback to create
  if (!picked) {
    return doCreateOrder(authHeaders, vuId, iterId);
  }

  const newStatus = nextStatus(picked.status);

  const res = http.put(
    `${BASE_URL}/orders/${picked.id}/status?status=${newStatus}`,
    null,
    {
      headers: authHeaders,
      tags: { name: 'PUT /orders/{id}/status' },
    },
  );

  const ok = check(res, {
    'update: status 202': (r) => r.status === 202,
    'update: has orderId': (r) => {
      try { return JSON.parse(r.body).orderId !== undefined; } catch { return false; }
    },
  });

  if (ok) {
    vuOrders[picked.id] = newStatus;   // track new status locally
    ordersUpdated.add(1);
    updateDuration.add(res.timings.duration);
    successRate.add(true);
    return { id: picked.id, status: newStatus };
  }

  failures.add(1);
  successRate.add(false);
  if (iterId < 3) {
    console.warn(`VU ${vuId} update failed: ${res.status} – ${res.body}`);
  }
  return null;
}

// ─── Action: Fetch Order By ID ──────────────────────────────────
// Uses: GET /orders (paginated) and verifies response structure

function doFetchOrders(authHeaders, vuId, iterId) {
  const picked = pickRandomOrder();

  // Nothing to fetch yet → fallback to create
  if (!picked) {
    return doCreateOrder(authHeaders, vuId, iterId);
  }

  const res = http.get(`${BASE_URL}/orders?page=0&size=20`, {
    headers: authHeaders,
    tags: { name: 'GET /orders (paginated)' },
  });

  const ok = check(res, {
    'fetch: status 200':       (r) => r.status === 200,
    'fetch: has content':      (r) => {
      try { return JSON.parse(r.body).content !== undefined; } catch { return false; }
    },
    'fetch: has totalElements': (r) => {
      try { return JSON.parse(r.body).totalElements !== undefined; } catch { return false; }
    },
  });

  if (ok) {
    ordersFetched.add(1);
    fetchDuration.add(res.timings.duration);
    successRate.add(true);
  } else {
    failures.add(1);
    successRate.add(false);
    if (iterId < 3) {
      console.warn(`VU ${vuId} fetch failed: ${res.status} – ${res.body}`);
    }
  }
  return null;   // fetch does not produce an order for webhook
}

// ─── Webhook Simulation ─────────────────────────────────────────
// Uses: POST /webhook/payment  { orderId, status }
// This is the actual webhook endpoint from WebhookController.java.
// It triggers a status update without auth and sends WebSocket notifications.

function maybeFireWebhook(order) {
  if (!order) return;
  if (Math.random() > WEBHOOK_PROBABILITY) return;

  // Pick the NEXT status to simulate an external payment/shipping system advancing the order
  const webhookStatus = nextStatus(order.status);

  const webhookPayload = JSON.stringify({
    orderId: order.id,
    status:  webhookStatus,
  });

  const res = http.post(`${BASE_URL}/webhook/payment`, webhookPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST /webhook/payment' },
  });

  const ok = check(res, {
    'webhook: status 202': (r) => r.status === 202,
  });

  if (ok) {
    vuOrders[order.id] = webhookStatus;   // track the webhook-updated status
    webhookTriggered.add(1);
    webhookDuration.add(res.timings.duration);
  } else {
    failures.add(1);
  }
}

// ─── Main Test Function ─────────────────────────────────────────
// Each iteration:
//   1. Authenticate (dev token)
//   2. Randomly pick an action (create 60% | update status 30% | fetch 10%)
//   3. Optionally fire a webhook (50% after create/update)
//   4. Think time (0.5s – 3s)

export default function () {
  const vuId   = __VU;
  const iterId = __ITER;

  // ── Step 1: Obtain dev token ──
  const tokenPayload = JSON.stringify({
    name:  `LoadUser-${vuId}`,
    email: `loaduser-${vuId}@test.com`,
    role:  'ADMIN',
  });

  const tokenRes = http.post(`${BASE_URL}/dev/token`, tokenPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST /dev/token' },
  });

  const tokenOk = check(tokenRes, {
    'token: status 200':      (r) => r.status === 200,
    'token: has token field':  (r) => {
      try { return JSON.parse(r.body).token !== undefined; } catch { return false; }
    },
  });

  if (!tokenOk) {
    tokenFailed.add(1);
    failures.add(1);
    successRate.add(false);
    sleep(1);
    return;
  }

  const token = JSON.parse(tokenRes.body).token;
  const authHeaders = {
    'Content-Type':  'application/json',
    Authorization:   `Bearer ${token}`,
  };

  // ── Step 2: Random action selection ──
  const roll = Math.random();
  let resultOrder = null;

  if (roll < ACTION_CREATE_WEIGHT) {
    // 60% → Create order
    resultOrder = doCreateOrder(authHeaders, vuId, iterId);
  } else if (roll < ACTION_CREATE_WEIGHT + ACTION_UPDATE_WEIGHT) {
    // 30% → Update order status through pipeline (falls back to create if no orders)
    resultOrder = doUpdateStatus(authHeaders, vuId, iterId);
  } else {
    // 10% → Fetch orders (paginated) (falls back to create if no orders)
    doFetchOrders(authHeaders, vuId, iterId);
  }

  // ── Step 3: Webhook simulation (50% after create/update) ──
  // Simulates an external system (payment gateway, shipping) advancing the order
  maybeFireWebhook(resultOrder);

  // ── Step 4: Think time ──
  thinkTime();
}

// ─── Teardown ───────────────────────────────────────────────────
export function teardown() {
  console.log('═══════════════════════════════════════');
  console.log('  Load Test Complete');
  console.log('═══════════════════════════════════════');
}
