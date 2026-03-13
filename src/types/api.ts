export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface DeviceResponse {
  id: string;
  deviceId: number;
  portCount: number;
  location: string;
  isOnline: boolean;
  devAddr: number;
  ownerId: string;
  partnerId?: string;
  lastSeen?: string;
  createdAt: string;
  updatedAt?: string;
  owner?: {
    id: string;
    email: string;
    name: string;
  };
  // Телеметрия из Redis
  electrical?: {
    voltagePhase1: number;
    voltagePhase2: number;
    voltagePhase3: number;
    phases: number;
    maxCurrentA: number;
    relayState: 'on' | 'off';
  };
  temperature?: {
    inputContacts: number;
    port0: number;
    port1: number;
    internal: number;
  };
}

// Backend Session
export interface SessionResponse {
  id: string;
  deviceId: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  energyKwh?: number;
  cost?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ERROR';
  createdAt: string;
  updatedAt?: string;
}

export function mapDeviceToStation(device: DeviceResponse) {
  return {
    id: device.id,
    name: device.owner?.name || `Станция ${device.id.slice(0, 8)}`,
    address: device.location || '',
    latitude: 55.751244, // Default Moscow
    longitude: 37.618423,
    status: device.isOnline ? 'available' as const : 'offline' as const,
    connectors: Array.from({ length: device.portCount }, (_, i) => ({
      id: `c-${device.id}-${i}`,
      stationId: device.id,
      type: 'Type2' as const,
      powerKw: 22,
      status: device.isOnline ? 'available' as const : 'offline' as const,
    })),
    ownerId: device.ownerId,
    organizationId: device.partnerId,
    createdAt: device.createdAt,
    electrical: device.electrical || {
      voltagePhase1: 0,
      voltagePhase2: 0,
      voltagePhase3: 0,
      phases: 3,
      maxCurrentA: 32,
      relayState: 'off' as const,
    },
    temperature: device.temperature || {
      inputContacts: 0,
      port0: 0,
      port1: 0,
      internal: 0,
    },
    stats: {
      energyTodayKwh: 0,
      sessionsToday: 0,
      totalSessions: 0,
      totalEnergyKwh: 0,
      totalHours: 0,
    },
  };
}

export function mapSessionToChargingSession(session: SessionResponse, stationId: string) {
  return {
    id: session.id,
    stationId,
    connectorId: `c-${stationId}-0`,
    userId: session.userId || '',
    startTime: session.startTime,
    endTime: session.endTime,
    energyKwh: session.energyKwh || 0,
    cost: session.cost || 0,
    status: mapSessionStatus(session.status),
  };
}

function mapSessionStatus(status: SessionResponse['status']): 'active' | 'completed' | 'cancelled' | 'error' {
  switch (status) {
    case 'IN_PROGRESS':
      return 'active';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    case 'ERROR':
      return 'error';
    default:
      return 'completed';
  }
}
