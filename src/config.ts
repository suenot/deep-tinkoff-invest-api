import { DesiredWallet } from './types.d';

export const DESIRED_WALLET: DesiredWallet = {
  TMOS: 20, // 25% Тинькофф iMOEX (TMOS)
  RUB: 20, // 25% Рублей
  TBRU: 20, // 25% Тинькофф Bonds
  TRUR: 20, // 25% Тинькофф Вечный портфель (TRUR)
  VTBR: 20, // 20$ Акции ВТБ, т.к. там 1 лот 10000 акций
};

export const BALANCE_INTERVAL: number = 60000; // Раз в минуту

export const SLEEP_BETWEEN_ORDERS: number = 3000; // 3 секунды
