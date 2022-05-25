import { DesiredWallet } from './types.d';

export const DESIRED_WALLET: DesiredWallet = {
  TMOS: 25, // 25% Тинькофф iMOEX (TMOS)
  RUB: 25, // 25% Рублей
  TBRU: 25, // 25% Тинькофф Bonds
  TRUR: 25, // 25% Тинькофф Вечный портфель (TRUR)
};

export const BALANCE_INTERVAL: number = 60000; // Раз в минуту

export const SLEEP_BETWEEN_ORDERS: number = 2000; // 2 секунды
