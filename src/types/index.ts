// Основные типы для EV Charging Admin Panel
// ⚠️ Бизнес-логика: НЕ ИЗМЕНЯТЬ структуру данных, статусы, типы

export type UserRole = 'individual' | 'business';

export type ChargerStatus = 'available' | 'charging' | 'offline' | 'maintenance';

export type ConnectorType = 'Type2' | 'CCS' | 'CHAdeMO' | 'GB/T';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  organizationId?: string;
}

export interface Organization {
  id: string;
  name: string;
  inn?: string;
  ownerId: string;
  createdAt: string;
}

export interface StationElectrical {
  voltagePhase1: number;
  voltagePhase2: number;
  voltagePhase3: number;
  phases: number;
  maxCurrentA: number;
  relayState: 'on' | 'off';
}

export interface StationTemperature {
  inputContacts: number;
  port0: number;
  port1: number;
  internal: number;
}

export interface StationStats {
  energyTodayKwh: number;
  sessionsToday: number;
  totalSessions: number;
  totalEnergyKwh: number;
  totalHours: number;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: ChargerStatus;
  connectors: Connector[];
  ownerId: string;
  organizationId?: string;
  createdAt: string;
  electrical: StationElectrical;
  temperature: StationTemperature;
  stats: StationStats;
  /** Bitmask of active faults (bits 1–12). Optional, 0 = no errors */
  errorBits?: number;
}

export interface Connector {
  id: string;
  stationId: string;
  type: ConnectorType;
  powerKw: number;
  status: ChargerStatus;
}

export interface ChargingSession {
  id: string;
  stationId: string;
  connectorId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  energyKwh: number;
  cost: number;
  status: 'active' | 'completed' | 'cancelled' | 'error';
  /** Live telemetry — may be absent if server hasn't sent data yet */
  currentAmps?: number;
  currentKw?: number;
}

export interface Tariff {
  id: string;
  stationId?: string;
  organizationId?: string;
  name: string;
  pricePerKwh: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface Statistics {
  totalSessions: number;
  totalEnergyKwh: number;
  totalRevenue: number;
  activeStations: number;
  averageSessionDuration: number;
}
