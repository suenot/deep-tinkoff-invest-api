import { DesiredWallet } from './types.d';

export const DESIRED_WALLET: DesiredWallet = {
  TMOS: 30, // 30% Тинькофф iMOEX (TMOS)
  RUB: 0, // 0% Рублей
  TBRU: 30, // 30% Тинькофф Bonds
  TRUR: 30, // 30% Тинькофф Вечный портфель (TRUR)
  // MTLR: 10, // 10% Мечел
};

export const BALANCE_INTERVAL: number = 60000; // Раз в минуту

export const SLEEP_BETWEEN_ORDERS: number = 3000; // 3 секунды
