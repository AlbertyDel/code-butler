// Station error bitfield mapping and helpers

export interface StationError {
  bit: number;
  label: string;
  description: string;
}

export const STATION_ERRORS: StationError[] = [
  { bit: 1, label: 'Высокое напряжение', description: 'Более чем ГОСТ +20%. Ошибка активна, пока условие валидно' },
  { bit: 2, label: 'Низкое напряжение', description: 'Менее чем ГОСТ -20%. Ошибка активна, пока условие валидно' },
  { bit: 3, label: 'Высокий выходной ток выход 0', description: 'Более чем Cable current limit. Активна до сброса сессии' },
  { bit: 4, label: 'Высокий выходной ток выход 1', description: 'Более чем Cable current limit. Активна до сброса сессии' },
  { bit: 5, label: 'Relay fault', description: 'Реле не меняет состояние после включения/выключения. Активна до ребута' },
  { bit: 6, label: 'RCD fault (GFCI)', description: 'Утечка тока / КЗ кабеля. Активна до ребута' },
  { bit: 7, label: 'Pilot ERROR (Status 6)', description: 'Ошибка на стороне авто. Активна до сброса сессии' },
  { bit: 8, label: 'Перегрев контакта входной фазы', description: '50°C. Ошибка активна, пока условие валидно' },
  { bit: 9, label: 'Перегрев контакта выходной фазы', description: '50°C. Ошибка активна, пока условие валидно' },
  { bit: 10, label: 'Высокая температура в корпусе', description: '50°C. Ошибка активна, пока условие валидно' },
  { bit: 11, label: 'Станция подвисла', description: 'Произошла перезагрузка по watchdog' },
  { bit: 12, label: 'Fire Alarm / Emergency STOP', description: 'Сработал сухой контакт пожарной сигнализации или аварийная остановка. Активна, пока сохраняется условие' },
];

export function getActiveErrors(errorBits: number | undefined): StationError[] {
  if (!errorBits) return [];
  return STATION_ERRORS.filter(e => (errorBits >> (e.bit - 1)) & 1);
}

export function hasErrors(errorBits: number | undefined): boolean {
  return !!errorBits && errorBits > 0;
}
