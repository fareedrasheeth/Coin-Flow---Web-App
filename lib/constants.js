// CoinFlow System Constants & Metadata

export const SRI_LANKAN_COINS = [
  {
    id: 'slot_1',
    slot_id: 'rs1_small',
    name: 'Rs.1 Small',
    label: 'Rs.1 Small',
    coinValue: 1,
    denomination: 1,
    color: '#A78BFA',
    bgGlow: 'rgba(167, 139, 250, 0.2)',
    icon: '🪙',
    gpioSensor: 'GPIO 14',
    gpioServo: 'GPIO 16',
    defaultLimitType: 'value', // 'count' or 'value'
    defaultLimit: 500, // Rs. 500 max limit
    diameter: '20.0 mm',
  },
  {
    id: 'slot_2',
    slot_id: 'rs2_small',
    name: 'Rs.2 Small',
    label: 'Rs.2 Small',
    coinValue: 2,
    denomination: 2,
    color: '#818CF8',
    bgGlow: 'rgba(129, 140, 248, 0.2)',
    icon: '🪙',
    gpioSensor: 'GPIO 12',
    gpioServo: 'GPIO 17',
    defaultLimitType: 'value',
    defaultLimit: 500,
    diameter: '22.0 mm',
  },
  {
    id: 'slot_3',
    slot_id: 'rs5',
    name: 'Rs.5',
    label: 'Rs.5',
    coinValue: 5,
    denomination: 5,
    color: '#6366F1',
    bgGlow: 'rgba(99, 102, 241, 0.2)',
    icon: '🪙',
    gpioSensor: 'GPIO 27',
    gpioServo: 'GPIO 5',
    defaultLimitType: 'count',
    defaultLimit: 100, // 100 coins max limit
    diameter: '23.5 mm',
  },
  {
    id: 'slot_4',
    slot_id: 'rs1_big',
    name: 'Rs.1 Big',
    label: 'Rs.1 Big',
    coinValue: 1,
    denomination: 1,
    color: '#8B5CF6',
    bgGlow: 'rgba(139, 92, 246, 0.2)',
    icon: '🪙',
    gpioSensor: 'GPIO 26',
    gpioServo: 'GPIO 18',
    defaultLimitType: 'value',
    defaultLimit: 500,
    diameter: '25.0 mm',
  },
  {
    id: 'slot_5',
    slot_id: 'rs10',
    name: 'Rs.10',
    label: 'Rs.10',
    coinValue: 10,
    denomination: 10,
    color: '#00D4FF',
    bgGlow: 'rgba(0, 212, 255, 0.2)',
    icon: '🪙',
    gpioSensor: 'GPIO 25',
    gpioServo: 'GPIO 19',
    defaultLimitType: 'value',
    defaultLimit: 500, // Rs. 500 max limit
    diameter: '26.4 mm',
  },
  {
    id: 'slot_6',
    slot_id: 'rs20',
    name: 'Rs.20',
    label: 'Rs.20',
    coinValue: 20,
    denomination: 20,
    color: '#6C63FF',
    bgGlow: 'rgba(108, 99, 255, 0.2)',
    icon: '🪙',
    gpioSensor: 'GPIO 33',
    gpioServo: 'GPIO 21',
    defaultLimitType: 'value',
    defaultLimit: 500, // Rs. 500 max limit
    diameter: '28.0 mm',
  },
  {
    id: 'slot_7',
    slot_id: 'rs2_big',
    name: 'Rs.2 Big',
    label: 'Rs.2 Big',
    coinValue: 2,
    denomination: 2,
    color: '#7C3AED',
    bgGlow: 'rgba(124, 58, 237, 0.2)',
    icon: '🪙',
    gpioSensor: 'GPIO 32',
    gpioServo: 'GPIO 22',
    defaultLimitType: 'value',
    defaultLimit: 500,
    diameter: '28.5 mm',
  },
];

export const COIN_SLOTS = SRI_LANKAN_COINS;

export const MACHINE_STATES = {
  ACTIVE: { label: 'Active', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', badge: 'badge-active' },
  SORTING: { label: 'Sorting Coin', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', badge: 'badge-sorting' },
  PAUSED: { label: 'Paused', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', badge: 'badge-paused' },
  SLOT_FULL: { label: 'Slot Full', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', badge: 'badge-full' },
  RESET_REQUIRED: { label: 'Reset Required', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)', badge: 'badge-reset' },
  OFFLINE: { label: 'Offline', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.15)', badge: 'badge-offline' },
  ERROR: { label: 'Hardware Fault', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.15)', badge: 'badge-error' },
};

export const SIDEBAR_MENU = [
  { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', path: '/' },
  { id: 'slots', label: 'Coin Slots', icon: 'Grid', path: '/slots' },
  { id: 'activity', label: 'Live Activity', icon: 'Activity', path: '/activity' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3', path: '/analytics' },
  { id: 'control', label: 'Machine Control', icon: 'Sliders', path: '/control' },
  { id: 'sensors', label: 'Sensors', icon: 'Cpu', path: '/sensors' },
  { id: 'servos', label: 'Servo Motors', icon: 'Zap', path: '/servos' },
  { id: 'history', label: 'History', icon: 'History', path: '/history' },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
];

export const ACHIEVEMENT_TIERS = [
  { id: 'starter', label: 'Coin Starter', emoji: '🥉', threshold: 500, color: '#CD7F32' },
  { id: 'saver', label: 'Coin Saver', emoji: '🥈', threshold: 5000, color: '#C0C0C0' },
  { id: 'master', label: 'Coin Master', emoji: '🥇', threshold: 10000, color: '#FFD700' },
  { id: 'legend', label: 'Coin Legend', emoji: '💎', threshold: 50000, color: '#00D4FF' },
];

export const LOCATION_CATEGORIES = [
  { id: 'bank', label: 'Banks', icon: '🏦', color: '#6C63FF' },
  { id: 'exchange', label: 'Coin Exchange', icon: '💱', color: '#00D4FF' },
  { id: 'supermarket', label: 'Supermarkets', icon: '🛒', color: '#00FF94' },
  { id: 'currency', label: 'Currency Exchange', icon: '💵', color: '#FFB800' },
];

// Exactly 7 IR Sensors (One below each sorting hole)
export const ALL_SENSORS = [
  { id: 'sensor_rs1_small', name: 'Rs.1 Small IR Sensor', gpio: 'GPIO 14', type: 'Slot 1 Detection' },
  { id: 'sensor_rs2_small', name: 'Rs.2 Small IR Sensor', gpio: 'GPIO 12', type: 'Slot 2 Detection' },
  { id: 'sensor_rs5', name: 'Rs.5 IR Sensor', gpio: 'GPIO 27', type: 'Slot 3 Detection' },
  { id: 'sensor_rs1_big', name: 'Rs.1 Big IR Sensor', gpio: 'GPIO 26', type: 'Slot 4 Detection' },
  { id: 'sensor_rs10', name: 'Rs.10 IR Sensor', gpio: 'GPIO 25', type: 'Slot 5 Detection' },
  { id: 'sensor_rs20', name: 'Rs.20 IR Sensor', gpio: 'GPIO 33', type: 'Slot 6 Detection' },
  { id: 'sensor_rs2_big', name: 'Rs.2 Big IR Sensor', gpio: 'GPIO 32', type: 'Slot 7 Detection' },
];

export const ALL_SERVOS = [
  { id: 'servo_entry', name: 'Main Coin Entry Servo', gpio: 'GPIO 4', role: 'Entry Control', homeAngle: 0, ejectAngle: 90 },
  { id: 'servo_rs1_small', name: 'Rs.1 Small Compartment Servo', gpio: 'GPIO 16', role: 'Slot Ejector', homeAngle: 0, ejectAngle: 90 },
  { id: 'servo_rs2_small', name: 'Rs.2 Small Compartment Servo', gpio: 'GPIO 17', role: 'Slot Ejector', homeAngle: 0, ejectAngle: 90 },
  { id: 'servo_rs5', name: 'Rs.5 Compartment Servo', gpio: 'GPIO 5', role: 'Slot Ejector', homeAngle: 0, ejectAngle: 90 },
  { id: 'servo_rs1_big', name: 'Rs.1 Big Compartment Servo', gpio: 'GPIO 18', role: 'Slot Ejector', homeAngle: 0, ejectAngle: 90 },
  { id: 'servo_rs10', name: 'Rs.10 Compartment Servo', gpio: 'GPIO 19', role: 'Slot Ejector', homeAngle: 0, ejectAngle: 90 },
  { id: 'servo_rs20', name: 'Rs.20 Compartment Servo', gpio: 'GPIO 21', role: 'Slot Ejector', homeAngle: 0, ejectAngle: 90 },
  { id: 'servo_rs2_big', name: 'Rs.2 Big Compartment Servo', gpio: 'GPIO 22', role: 'Slot Ejector', homeAngle: 0, ejectAngle: 90 },
];

export const DEFAULT_WEBSOCKET_URL = 'ws://192.168.1.104:81';
