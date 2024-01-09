import { DesiredWallet } from './types.d';

export const DESIRED_WALLET: DesiredWallet = {
  TMOS: 30, // 30% Тинькофф iMOEX (TMOS)
  RUB: 30, // 0% Рублей
  TRUR: 30, // 30% Тинькофф Вечный портфель (TRUR)
  // MTLR: 10, // 10% Мечел
};

// TODO: Добавить target: BASE/QUOTE
// export const DESIRED_WALLETS: DesiredWallet[] = [
//   {
//     ESPR: 1.99,
//     GTLB: 2.63,
//     OZON: 6.5,
//     TCSG: 39.42,
//     TCS: 5.34,
//     VKCO: 14.75,
//     TBRU: 0.58,
//     TBUY: 0.49,
//     TFNX: 1.7,
//     TSPV: 0.09,
//     FESH: 1,
//     RUB: 26.51,
//   },
//   {
//     TMOS: 30, // 30% Тинькофф iMOEX (TMOS)
//     TBRU: 30, // 30% Тинькофф Bonds
//     TRUR: 30, // 30% Тинькофф Вечный портфель (TRUR)
//     RUB: 0, // 0% Рублей
//     // MTLR: 10, // 10% Мечел
//   },
// ];

export const BALANCE_INTERVAL: number = 60000; // Раз в 1 минуту

export const SLEEP_BETWEEN_ORDERS: number = 3000; // 3 секунды
