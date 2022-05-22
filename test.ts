import 'dotenv/config';
import 'mocha';
import { expect } from 'chai';
import _ from 'lodash';
// import uniqid from 'uniqid';
import { instruments } from './instrumentsData';
import { debugPort } from 'process';

const debug = require('debug')('bot').extend('balancer');

const USD_FIGI = 'BBG0013HGFT4';
(global as any).INSTRUMENTS = instruments;

const sumValues = obj => Object.values(obj).reduce((a: number, b: number) => a + b);

const zeroPad = (num, places) => String(num).padStart(places, '0');

interface TinkoffBigNumber {
  units: number;
  nano: number;
}

interface Position {
  pair?: string;
  base?: string;
  quote?: string;
  figi?: string;
  amount?: number;
  lotSize?: number;
  price?: TinkoffBigNumber;
  priceNumber?: number;
  lotPrice?: TinkoffBigNumber;
  lotPriceNumber?: number;
  minPriceIncrement?: TinkoffBigNumber;
  minPriceIncrementNumber?: number;
}

type Wallet = Position[];

interface DesiredWallet {
  [key: string]: Number;
}

const normalizeDesire = (wallet: DesiredWallet): DesiredWallet => {
  debug('Нормализуем проценты, чтобы общая сумма была равна 100%, чтобы исключить человеческий фактор');
  debug('wallet', wallet);

  const walletSum: number = Number(sumValues(wallet));
  debug('walletSum', walletSum);

  const normalizedDesire = Object.entries(wallet).reduce((p, [k, v]) => ({ ...p, [k]: (Number(v) / walletSum * 100) }), {});
  debug('normalizedDesire', normalizedDesire);

  return normalizedDesire;
};

// const calculateLotPrice = () => {

// }

// const calculateLotPriceInUsd = () => {

// }

const convertTinkoffNumberToNumber = (n: TinkoffBigNumber): number => {
  const result = Number(`${n.units}.${zeroPad(n.nano, 9)}`);
  debug(convertTinkoffNumberToNumber, result);
  return result;
};

const addNumbersToPosition = (position: Position): Position => {
  position.priceNumber = convertTinkoffNumberToNumber(position.price);
  position.lotPriceNumber = convertTinkoffNumberToNumber(position.lotPrice);
  // position.minPriceIncrementNumber = convertTinkoffNumberToNumber(position.minPriceIncrement);
  debug('addNumbersToPosition', position);
  return position;
};

const addNumbersToWallet = (wallet: Wallet): Wallet => {
  for (let position of wallet) {
    position = addNumbersToPosition(position);
  }
  debug('addNumbersToWallet', wallet);
  return wallet;
};

const sortByLotPrice = (wallets: Wallet[]) => {

};

describe('bot', () => {
  describe('balancer', () => {
    it.skip('Тест normalizeDezire', async () => {
      const desiredWallet: DesiredWallet = {
        AAPL: 100,
        USD: 50,
      };
      const normalizedDesire = normalizeDesire(desiredWallet);

      expect(normalizedDesire).to.deep.equal({ AAPL: 66.66666666666666, USD: 33.33333333333333 });
    });

    it.only('Тест сортировки по лотности', async () => {
      // const desiredWallet: DesiredWallet = {
      //   TRUR: 50,
      //   TMOS: 50,
      // };
      const wallet: Wallet = [
        {
          pair: 'RUB/RUB',
          base: 'RUB',
          quote: 'RUB',
          figi: undefined,
          amount: 0,
          lotSize: 1,
          price: {
            units: 1,
            nano: 0,
          },
          lotPrice: {
            units: 1,
            nano: 0,
          },
        },
        {
          pair: 'TRUR/RUB',
          base: 'TRUR',
          quote: 'RUB',
          figi: 'BBG000000001',
          amount: 1000,
          lotSize: 1,
          price: {
            units: 5,
            nano: 380000000,
          },
          lotPrice: {
            units: 5,
            nano: 380000000,
          },
        },
        {
          pair: 'TMOS/RUB',
          base: 'TMOS',
          quote: 'RUB',
          figi: 'BBG333333333',
          amount: 2000,
          lotSize: 1,
          price: {
            units: 4,
            nano: 176000000,
          },
          lotPrice: {
            units: 4,
            nano: 176000000,
          },
        },
      ];
      addNumbersToWallet(wallet);
      debug('addNumbersToWallet', addNumbersToWallet);

    });

    it.skip('Тест простой балансировки позиций только в рублях', async () => {
      const desiredWallet: DesiredWallet = {
        TRUR: 50,
        TMOS: 50,
      };
      const wallet: Wallet = [
        {
          pair: 'RUB/RUB',
          base: 'RUB',
          quote: 'RUB',
          figi: undefined,
          amount: 0,
          lotSize: 1,
          price: {
            units: 1,
            nano: 0,
          },
          lotPrice: {
            units: 1,
            nano: 0,
          },
        },
        {
          pair: 'TRUR/RUB',
          base: 'TRUR',
          quote: 'RUB',
          figi: 'BBG000000001',
          amount: 1000,
          lotSize: 1,
          price: {
            units: 5,
            nano: 380000000,
          },
          lotPrice: {
            units: 5,
            nano: 380000000,
          },
        },
        {
          pair: 'TMOS/RUB',
          base: 'TMOS',
          quote: 'RUB',
          figi: 'BBG333333333',
          amount: 2000,
          lotSize: 1,
          price: {
            units: 4,
            nano: 176000000,
          },
          lotPrice: {
            units: 4,
            nano: 176000000,
          },
        },
      ];

    });

    it.skip('Тест балансировки', async () => {
      // Нужно узнать лотность и последнюю ценю
      // Использовать данные последних цен
      // Лотность берется из инструмента
      const wallet: Wallet = [
        {
          pair: 'RUB/RUB',
          base: 'RUB',
          quote: 'RUB',
          figi: undefined,
          amount: 100000,
          lotSize: 1,
          price: {
            units: 1,
            nano: 0,
          },
        },
        {
          pair: 'USD/RUB',
          base: 'USD',
          quote: 'RUB',
          figi: 'BBG0013HGFT4',
          amount: 1000,
          lotSize: 1,
          price: {
            units: 1,
            nano: 0,
          },
        },
        {
          pair: 'AAPL/USD',
          base: 'AAPL',
          quote: 'USD',
          figi: 'BBG000B9XRY4',
          amount: 2,
          lotSize: 1,
          price: {
            units: 130,
            nano: 0,
          },
        },
      ];

      const desiredWallet = {
        AAPL: 100,
        USD: 50,
        RUB: 10,
      };
      const normalizedDesire = normalizeDesire(desiredWallet);

      // const lastBidPriceUsd = getLastBidPrice('USD');

      // calculateTotalInUSD(wallet, lastBidPriceUSD);

      // calculateLotPriceInUsd(wallet, lastBidPriceUSD);

      // sortPositionsByLotPrice(wallet, side) // side: desc/asc

      // balanceFlow(wallet, desiredWallet)
        // for(desiredPosition of desiredWallet) {
        //   find wallet[desiredPosition]
        //   recalculatePosition()
        // }

      expect(undefined).to.equal(undefined);
    });
  });
});
