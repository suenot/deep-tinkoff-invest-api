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

interface TinkoffNumber {
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
  price?: TinkoffNumber;
  priceNumber?: number;
  lotPrice?: TinkoffNumber;
  lotPriceNumber?: number;
  minPriceIncrement?: TinkoffNumber;
  minPriceIncrementNumber?: number;
  totalPrice?: TinkoffNumber;
  totalPriceNumber?: number;
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

const convertTinkoffNumberToNumber = (n: TinkoffNumber): number => {
  const result = Number(`${n.units}.${zeroPad(n.nano, 9)}`);
  debug(convertTinkoffNumberToNumber, result);
  return result;
};

const convertNumberToTinkoffNumber = (n: number): TinkoffNumber => {
  const [units, nano] = n.toFixed(9).split('.').map(item => Number(item));
  return {
    units,
    nano,
  };
};

const addNumbersToPosition = (position: Position): Position => {
  position.priceNumber = convertTinkoffNumberToNumber(position.price);
  position.lotPriceNumber = convertTinkoffNumberToNumber(position.lotPrice);
  position.totalPriceNumber = convertTinkoffNumberToNumber(position.totalPrice);
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

// const sortByLotPrice = (wallets: Wallet[]) => {

// };

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

    it.skip('Тест сортировки по лотности', async () => {
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

      const walletWithNumbers = addNumbersToWallet(wallet);
      debug('addNumbersToWallet', addNumbersToWallet);

      // sortPositionsByLotPrice(wallet, 'desc') // side: desc/asc
      const sortedWallet = _.orderBy(walletWithNumbers, ['lotPriceNumber'], ['desc']);
      debug('sortedWallet', sortedWallet);

      expect(sortedWallet).to.deep.equal(
        [
          {
            pair: 'TRUR/RUB',
            base: 'TRUR',
            quote: 'RUB',
            figi: 'BBG000000001',
            amount: 1000,
            lotSize: 1,
            price: { units: 5, nano: 380000000 },
            lotPrice: { units: 5, nano: 380000000 },
            priceNumber: 5.38,
            lotPriceNumber: 5.38
          },
          {
            pair: 'TMOS/RUB',
            base: 'TMOS',
            quote: 'RUB',
            figi: 'BBG333333333',
            amount: 2000,
            lotSize: 1,
            price: { units: 4, nano: 176000000 },
            lotPrice: { units: 4, nano: 176000000 },
            priceNumber: 4.176,
            lotPriceNumber: 4.176
          },
          {
            pair: 'RUB/RUB',
            base: 'RUB',
            quote: 'RUB',
            figi: undefined,
            amount: 0,
            lotSize: 1,
            price: { units: 1, nano: 0 },
            lotPrice: { units: 1, nano: 0 },
            priceNumber: 1,
            lotPriceNumber: 1
          },
        ],
      );

    });

    it.only('Тест простой балансировки позиций только рублевых инструментов', async () => {
      const desiredWallet: DesiredWallet = {
        TRUR: 50,
        TMOS: 50,
        RUB: 0,
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

      // totalPrice
      const walletWithtotalPrice = _.map(wallet, (position: Position): Position => {
        const lotPriceNumber = convertTinkoffNumberToNumber(position.lotPrice);
        const totalPriceNumber = lotPriceNumber * position.amount;
        const totalPrice = convertNumberToTinkoffNumber(totalPriceNumber);
        position.totalPrice = totalPrice;
        return position;
      });

      const walletWithNumbers = addNumbersToWallet(walletWithtotalPrice);
      debug('addNumbersToWallet', addNumbersToWallet);

      // sortPositionsByLotPrice(wallet, 'desc') // side: desc/asc
      const sortedWallet = _.orderBy(walletWithNumbers, ['lotPriceNumber'], ['desc']);
      debug('sortedWallet', sortedWallet);

      // Суммируем все позиции в портефле
      const walletSum = _.sumBy(sortedWallet, 'totalPriceNumber');

      for (const [desiredTicker, desiredValue] of Object.entries(desiredWallet)) {
        // Ищем base (ticker) в wallet
        const position = _.find(sortedWallet, { base: desiredTicker });
        debug('position', position);


      }

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
