// Sri Lankan Coin Denomination Data
export const COIN_SLOTS = [
  {
    slot_id: 'rs1_small',
    label: 'Rs.1 Small',
    denomination: 1,
    color: '#A78BFA',
    icon: '🪙',
    servoThreshold: 500,
  },
  {
    slot_id: 'rs2_small',
    label: 'Rs.2 Small',
    denomination: 2,
    color: '#818CF8',
    icon: '🪙',
    servoThreshold: 500,
  },
  {
    slot_id: 'rs5',
    label: 'Rs.5',
    denomination: 5,
    color: '#6366F1',
    icon: '🪙',
    servoThreshold: 500,
  },
  {
    slot_id: 'rs1_big',
    label: 'Rs.1 Big',
    denomination: 1,
    color: '#8B5CF6',
    icon: '🪙',
    servoThreshold: 500,
  },
  {
    slot_id: 'rs10',
    label: 'Rs.10',
    denomination: 10,
    color: '#00D4FF',
    icon: '🪙',
    servoThreshold: 500,
  },
  {
    slot_id: 'rs20',
    label: 'Rs.20',
    denomination: 20,
    color: '#6C63FF',
    icon: '🪙',
    servoThreshold: 500,
  },
  {
    slot_id: 'rs2_big',
    label: 'Rs.2 Big',
    denomination: 2,
    color: '#7C3AED',
    icon: '🪙',
    servoThreshold: 500,
  },
];

// Achievement tiers
export const ACHIEVEMENT_TIERS = [
  { id: 'starter', label: 'Coin Starter', emoji: '🥉', threshold: 500, color: '#CD7F32' },
  { id: 'saver', label: 'Coin Saver', emoji: '🥈', threshold: 5000, color: '#C0C0C0' },
  { id: 'master', label: 'Coin Master', emoji: '🥇', threshold: 10000, color: '#FFD700' },
  { id: 'legend', label: 'Coin Legend', emoji: '💎', threshold: 50000, color: '#00D4FF' },
];

// Notification types
export const NOTIFICATION_TYPES = {
  COIN_DETECTED: { icon: '🪙', color: '#6C63FF', label: 'Coin Detected' },
  SLOT_FULL: { icon: '📦', color: '#FF4D6D', label: 'Slot Full' },
  SERVO_ACTIVATED: { icon: '⚙️', color: '#FFB800', label: 'Servo Activated' },
  MACHINE_DISCONNECTED: { icon: '🔴', color: '#FF4D6D', label: 'Machine Disconnected' },
  MACHINE_CONNECTED: { icon: '🟢', color: '#00FF94', label: 'Machine Connected' },
};

// Nearby location categories
export const LOCATION_CATEGORIES = [
  { id: 'bank', label: 'Banks', icon: '🏦', color: '#6C63FF' },
  { id: 'exchange', label: 'Coin Exchange', icon: '💱', color: '#00D4FF' },
  { id: 'supermarket', label: 'Supermarkets', icon: '🛒', color: '#00FF94' },
  { id: 'currency', label: 'Currency Exchange', icon: '💵', color: '#FFB800' },
];

// Navigation items
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics', path: '/analytics' },
  { id: 'map', label: 'Nearby Exchange', icon: 'map', path: '/map' },
  { id: 'rewards', label: 'Rewards', icon: 'rewards', path: '/rewards' },
  { id: 'health', label: 'Machine Health', icon: 'health', path: '/health' },
  { id: 'admin', label: 'Admin Panel', icon: 'admin', path: '/admin' },
];

// Smart insights templates
export const INSIGHTS = [
  'Most users insert Rs.10 coins.',
  'Rs.20 coins contribute 45% of total savings.',
  "Today's collection is 18% higher than yesterday.",
  'Your Rs.5 slot is nearly full — consider emptying soon.',
  'You saved 23% more this week compared to last week!',
  'Rs.1 Small coins are detected most frequently.',
  'The machine has been running smoothly for 72 hours straight.',
  'Pro tip: Mix different coins to balance slot usage.',
];
