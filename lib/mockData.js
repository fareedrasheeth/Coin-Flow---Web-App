import { COIN_SLOTS } from './constants';

// Seeded pseudo-random number generator (Mulberry32)
let seed = 12345;
function random() {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function resetSeed(val) {
  seed = val;
}

// Generate mock slot data
export function generateMockSlotData() {
  resetSeed(1001);
  return COIN_SLOTS.map((slot) => {
    const maxCoins = Math.floor(slot.servoThreshold / slot.denomination);
    const coinCount = Math.floor(random() * maxCoins * 0.85);
    const totalValue = coinCount * slot.denomination;
    const fillPercentage = Math.min(100, Math.round((totalValue / slot.servoThreshold) * 100));
    const status = fillPercentage >= 100 ? 'FULL' : fillPercentage >= 90 ? 'EJECTING' : 'ACTIVE';
    
    return {
      ...slot,
      coinCount,
      totalValue,
      fillPercentage,
      status,
    };
  });
}

// Generate mock analytics data
export function generateMockDailyData(days = 30) {
  resetSeed(2002);
  const data = [];
  const now = new Date('2026-06-20T12:00:00Z');
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: Math.floor(random() * 400 + 50),
    });
  }
  return data;
}

export function generateMockWeeklyData(weeks = 8) {
  resetSeed(3003);
  const data = [];
  for (let i = weeks - 1; i >= 0; i--) {
    data.push({
      week: `Week ${weeks - i}`,
      amount: Math.floor(random() * 2000 + 500),
    });
  }
  return data;
}

export function generateMockMonthlyData(months = 6) {
  resetSeed(4004);
  const data = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date('2026-06-20T12:00:00Z');
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    data.push({
      month: monthNames[date.getMonth()],
      amount: Math.floor(random() * 8000 + 2000),
    });
  }
  return data;
}

export function generateMockDenominationData(slots) {
  resetSeed(5005);
  return slots.map((slot) => ({
    label: slot.label,
    value: slot.totalValue || Math.floor(random() * 1000 + 100),
    color: slot.color,
  }));
}

// Generate mock coin events
export function generateMockEvents(count = 20) {
  resetSeed(6006);
  const events = [];
  const now = 1781961600000; // Fixed baseline timestamp
  for (let i = 0; i < count; i++) {
    const slot = COIN_SLOTS[Math.floor(random() * COIN_SLOTS.length)];
    const isServo = random() > 0.85;
    events.push({
      id: `evt_${now}_${i}`,
      timestamp: new Date(now - i * 30000).toISOString(),
      slotId: slot.slot_id,
      coinLabel: slot.label,
      denomination: slot.denomination,
      type: isServo ? 'servo' : 'coin',
      message: isServo
        ? `Servo activated for ${slot.label} slot`
        : `You inserted a ${slot.label} coin`,
    });
  }
  return events;
}

// Generate mock notifications
export function generateMockNotifications() {
  const now = 1781961600000; // Fixed baseline timestamp
  return [
    { id: 'n1', type: 'COIN_DETECTED', message: 'Rs.10 coin detected and sorted', timestamp: new Date(now - 60000).toISOString(), read: false },
    { id: 'n2', type: 'SERVO_ACTIVATED', message: 'Servo triggered for Rs.5 slot — auto ejection', timestamp: new Date(now - 300000).toISOString(), read: false },
    { id: 'n3', type: 'MACHINE_CONNECTED', message: 'ESP32 reconnected to CoinFlow', timestamp: new Date(now - 600000).toISOString(), read: true },
    { id: 'n4', type: 'SLOT_FULL', message: 'Rs.20 slot is at 95% capacity', timestamp: new Date(now - 1800000).toISOString(), read: true },
    { id: 'n5', type: 'COIN_DETECTED', message: 'Rs.2 Big coin detected and sorted', timestamp: new Date(now - 3600000).toISOString(), read: true },
  ];
}

// Generate mock health data
export function generateMockHealthData() {
  resetSeed(7007);
  return {
    esp32: { status: 'online', latency: 12, uptime: '72h 14m' },
    mqtt: { status: 'online', broker: 'HiveMQ Cloud', lastMessage: '2s ago' },
    power: { status: 'online', voltage: '5.1V', current: '0.42A' },
    irSensors: COIN_SLOTS.map((s) => ({
      slotId: s.slot_id,
      label: s.label,
      status: random() > 0.1 ? 'online' : 'warning',
      lastRead: `${Math.floor(random() * 10)}s ago`,
    })),
    servos: COIN_SLOTS.map((s) => ({
      slotId: s.slot_id,
      label: s.label,
      status: random() > 0.05 ? 'online' : 'offline',
      activations: Math.floor(random() * 20),
    })),
  };
}

// Generate nearby locations (Colombo area mock data)
export function generateMockLocations() {
  return [
    { id: 'l1', name: 'Bank of Ceylon - Fort', category: 'bank', lat: 6.9340, lng: 79.8438, distance: '1.2 km' },
    { id: 'l2', name: "People's Bank - Pettah", category: 'bank', lat: 6.9388, lng: 79.8535, distance: '2.1 km' },
    { id: 'l3', name: 'Commercial Bank - Colombo 7', category: 'bank', lat: 6.9071, lng: 79.8612, distance: '3.5 km' },
    { id: 'l4', name: 'Cargills Food City - Borella', category: 'supermarket', lat: 6.9147, lng: 79.8770, distance: '4.2 km' },
    { id: 'l5', name: 'Keells Super - Bambalapitiya', category: 'supermarket', lat: 6.8901, lng: 79.8563, distance: '5.0 km' },
    { id: 'l6', name: 'Star Exchange - Colombo 3', category: 'currency', lat: 6.9097, lng: 79.8524, distance: '2.8 km' },
    { id: 'l7', name: 'Lanka Money Exchange', category: 'exchange', lat: 6.9200, lng: 79.8600, distance: '3.1 km' },
    { id: 'l8', name: 'Sampath Bank - Nugegoda', category: 'bank', lat: 6.8725, lng: 79.8912, distance: '6.5 km' },
  ];
}

// Format currency
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-LK', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Time ago formatter
export function timeAgo(dateStr) {
  const now = new Date('2026-06-20T12:00:00Z'); // Fixed baseline timestamp to avoid runtime mismatch
  const date = new Date(dateStr);
  const seconds = Math.max(0, Math.floor((now - date) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
