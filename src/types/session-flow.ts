/**
 * UI-состояния сценария зарядной сессии.
 * Фронт НЕ управляет переходами — только отображает состояние,
 * полученное от сервера.
 */

export type SessionFlowState =
  | 'idle'
  | 'waiting_for_connector'
  | 'waiting_for_station_response'
  | 'connection_recovery'
  | 'session_active'
  | 'session_finishing'
  | 'session_finished'
  | 'fault';

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
 * Состояния idle, session_active, session_finished — без баннера.
 */
export const SESSION_FLOW_BANNER_MAP: Partial<Record<SessionFlowState, SessionFlowBannerConfig>> = {
  waiting_for_connector: {
    state: 'waiting_for_connector',
    variant: 'warning',
    message: 'Подключите кабель к электромобилю, чтобы начать зарядку.',
  },
  connection_recovery: {
    state: 'connection_recovery',
    variant: 'warning',
    message: 'Данные о зарядке обновятся после восстановления связи.',
    showSpinner: true,
  },
  session_finishing: {
    state: 'session_finishing',
    variant: 'progress',
    message: 'Ожидаем ответ от станции, чтобы завершить зарядку.',
    showSpinner: true,
  },
  waiting_for_station_response: {
    state: 'waiting_for_station_response',
    variant: 'progress',
    message: 'Ожидаем ответ от станции, чтобы завершить зарядку.',
    showSpinner: true,
  },
  fault: {
    state: 'fault',
    variant: 'error',
    message: 'Произошла ошибка на станции. Обратитесь в поддержку.',
  },
};
