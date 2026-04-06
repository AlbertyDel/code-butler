/**
 * UI-состояния сценария зарядной сессии.
 * Фронт НЕ управляет переходами — только отображает состояние,
 * полученное от сервера.
 */

export type SessionFlowState =
  | 'idle'
  | 'waiting_for_connector'
  | 'connection_recovery'
  | 'waiting_for_station_response';

export type BannerVariant = 'warning' | 'error' | 'progress';

export interface SessionFlowBannerConfig {
  state: SessionFlowState;
  variant: BannerVariant;
  message: string;
  showSpinner?: boolean;
}

/**
 * Маппинг состояний на конфигурацию persistent-баннера.
 * Тексты согласованы и НЕ подлежат изменению.
 * idle — без баннера.
 */
export const SESSION_FLOW_BANNER_MAP: Partial<Record<SessionFlowState, SessionFlowBannerConfig>> = {
  waiting_for_connector: {
    state: 'waiting_for_connector',
    variant: 'warning',
    message: 'Подключите коннектор к электромобилю, чтобы начать зарядку.',
  },
  connection_recovery: {
    state: 'connection_recovery',
    variant: 'warning',
    message: 'Данные о зарядке обновятся после восстановления связи.',
    showSpinner: true,
  },
  waiting_for_station_response: {
    state: 'waiting_for_station_response',
    variant: 'progress',
    message: 'Ожидаем ответ от станции, чтобы завершить зарядку.',
    showSpinner: true,
  },
};
