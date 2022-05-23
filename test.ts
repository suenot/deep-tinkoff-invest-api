import 'dotenv/config';
import { createSdk } from './invest-nodejs-grpc-sdk/src/sdk';
import 'mocha';
import { expect } from 'chai';
import _ from 'lodash';
import uniqid from 'uniqid';
import { instruments } from './instrumentsData';
// import { debugPort } from 'process';
import { OrderDirection, OrderType } from './invest-nodejs-grpc-sdk/src/generated/orders';
import { debugPort } from 'process';

const { orders } = createSdk(process.env.TOKEN || '');

const debug = require('debug')('bot').extend('balancer');

const USD_FIGI = 'BBG0013HGFT4';
(global as any).INSTRUMENTS = instruments;
(global as any).ORDERS = [];

const sumValues = obj => Object.values(obj).reduce((a: number, b: number) => a + b);

const zeroPad = (num, places) => String(num).padStart(places, '0');

const generateOrders = async (wallet: Wallet) => {
  debug('generateOrders');
  for (const position of wallet) {
    await generateOrder(position);
  }
};

const generateOrder = async (position: Position) => {
  debug('generateOrder');
  debug('position', position);

  if (position.base === 'RUB') {
    debug('Если позиция это рубль, то ничего не делаем');
    return false;
  }

  debug('Позиция не валюта');

  const direction = position.toBuyLots > 0 ? OrderDirection.ORDER_DIRECTION_BUY : OrderDirection.ORDER_DIRECTION_SELL;
  for (const i of _.range(position.toBuyLots)) {
    // Идея создавать однолотовые ордера, для того, чтобы они всегда исполнялись полностью, а не частично.
    // Могут быть сложности с:
    // - кол-вом разрешенных запросов к api, тогда придется реализовывать очередь.
    // - минимальный ордер может быть больше одного лота
    debug(`Создаем однолотовый ордер #${i}`);
    const order = {
      accountId: process.env.ACCOUNT_ID,
      figi: position.figi,
      quantity: 1,
      // price: { units: 40, nano: 0 },
      direction,
      orderType: OrderType.ORDER_TYPE_MARKET,
      orderId: uniqid(),
    };
    debug('Отправляем ордер', order);

    try {
      // const setOrder = await orders.postOrder(order);
      // debug('Успешно поставили ордер', setOrder);
    } catch (err) {
      console.warn('Ошибка при выставлении ордера', order);
      debug(err);
      console.trace(err);
    }
  }
};

// interface Order {
//     accountId: process.env.ACCOUNT_ID,
//     figi: process.env.FIGI || '',
//     quantity: 1,
//     price: { units: 40, nano: 0 },
//     direction: OrderDirection.ORDER_DIRECTION_SELL,
//     orderType: OrderType.ORDER_TYPE_LIMIT,
//     orderId: 'd1e5d152-d36e-4019-93cc-3a5db6c14f9f',
// }
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
  desiredAmountNumber?: number;
  canBuyBeforeTargetLots?: number;
  canBuyBeforeTargetNumber?: number;
  beforeDiffNumber?: number;
  toBuyLots?: number;
  toBuyNumber?: number;
}

type Wallet = Position[];

interface DesiredWallet {
  [key: string]: number;
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
        RUB: 0, // -1
      };
      const walletInfo = {
        remains: 0,
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
      const walletSumNumber = _.sumBy(sortedWallet, 'totalPriceNumber');
      debug('walletSumNumber', walletSumNumber);

      for (const [desiredTicker, desiredPercent] of Object.entries(desiredWallet)) {
        // Ищем base (ticker) в wallet
        const positionIndex = _.findIndex(sortedWallet, { base: desiredTicker });
        const position: Position = sortedWallet[positionIndex];
        debug('position', position);

        // Рассчитываем сколько в рублях будет ожидаемая доля (допустим, 50%)
        const desiredAmountNumber = walletSumNumber / 100 * desiredPercent;
        debug('desiredAmountNumber', desiredAmountNumber);
        position.desiredAmountNumber = desiredAmountNumber;

        // Высчитываем сколько лотов можно купить до желаемого таргета
        const canBuyBeforeTargetLots = Math.trunc(desiredAmountNumber / position.lotPriceNumber);
        debug('canBuyBeforeTargetLots', canBuyBeforeTargetLots);
        position.canBuyBeforeTargetLots = canBuyBeforeTargetLots;

        // Высчитываем стоимость позиции, которую можно купить до желаемого таргета
        const canBuyBeforeTargetNumber = canBuyBeforeTargetLots * position.lotPriceNumber;
        debug('canBuyBeforeTargetNumber', canBuyBeforeTargetNumber);
        position.canBuyBeforeTargetNumber = canBuyBeforeTargetNumber;

        // // Высчитываем сколько лотов можно купить за желаемым таргетом
        // const canBuyAfterTargetLots = canBuyBeforeTargetLots + position.lotPriceNumber;
        // debug('canBuyAfterTargetLots', canBuyAfterTargetLots);

        // // Высчитываем стоимость позиции, которую можно купить за желаемым таргетом
        // const canBuyAfterTargetNumber = canBuyAfterTargetLots * position.lotPriceNumber;
        // debug('canBuyAfterTargetNumber', canBuyAfterTargetNumber);

        // Высчитываем разницу между желаемым значением и значением до таргета. Нераспеределенный остаток.
        const beforeDiffNumber = Math.abs(desiredAmountNumber - canBuyBeforeTargetNumber);
        debug('beforeDiffNumber', beforeDiffNumber);
        position.beforeDiffNumber = beforeDiffNumber;

        debug('Суммируем остатки'); // TODO: нужно определить валюту и записать остаток в этой валюте
        walletInfo.remains += beforeDiffNumber; // пока в рублях

        // // Высчитываем разницу между желаемым значением и значением за таргетом
        // const afterDiffNumber = Math.abs(desiredAmountNumber - canBuyAfterTargetNumber);
        // debug('afterDiffNumber', afterDiffNumber);

        // // Выбираем меньшее число до желаемого таргета
        // const minToTarget = Math.min(beforeDiffNumber, afterDiffNumber) === beforeDiffNumber ? 'before' : 'after';
        // debug('minToTarget', minToTarget);

        debug('Сколько нужно купить (может быть отрицательным, тогда нужно продать)');
        const toBuyNumber = canBuyBeforeTargetNumber - position.totalPriceNumber;
        debug('toBuyNumber', toBuyNumber);
        position.toBuyNumber = toBuyNumber;

        debug('Сколько нужно купить лотов (может быть отрицательным, тогда нужно продать)');
        const toBuyLots = canBuyBeforeTargetLots - (position.amount / position.lotSize);
        debug('toBuyLots', toBuyLots);
        position.toBuyLots = toBuyLots;
      }
      debug('sortedWallet', sortedWallet);
      debug('walletInfo', walletInfo);

      // Для всех позиций создаем необходимые ордера

        // (global as any).ORDERS.push(position);
      generateOrders(sortedWallet);


    });

    // it.skip('Тест балансировки', async () => {
    //   // Нужно узнать лотность и последнюю ценю
    //   // Использовать данные последних цен
    //   // Лотность берется из инструмента
    //   const wallet: Wallet = [
    //     {
    //       pair: 'RUB/RUB',
    //       base: 'RUB',
    //       quote: 'RUB',
    //       figi: undefined,
    //       amount: 100000,
    //       lotSize: 1,
    //       price: {
    //         units: 1,
    //         nano: 0,
    //       },
    //     },
    //     {
    //       pair: 'USD/RUB',
    //       base: 'USD',
    //       quote: 'RUB',
    //       figi: 'BBG0013HGFT4',
    //       amount: 1000,
    //       lotSize: 1,
    //       price: {
    //         units: 1,
    //         nano: 0,
    //       },
    //     },
    //     {
    //       pair: 'AAPL/USD',
    //       base: 'AAPL',
    //       quote: 'USD',
    //       figi: 'BBG000B9XRY4',
    //       amount: 2,
    //       lotSize: 1,
    //       price: {
    //         units: 130,
    //         nano: 0,
    //       },
    //     },
    //   ];

    //   const desiredWallet = {
    //     AAPL: 100,
    //     USD: 50,
    //     RUB: 10,
    //   };
    //   const normalizedDesire = normalizeDesire(desiredWallet);

    //   // const lastBidPriceUsd = getLastBidPrice('USD');

    //   // calculateTotalInUSD(wallet, lastBidPriceUSD);

    //   // calculateLotPriceInUsd(wallet, lastBidPriceUSD);



    //   // sortPositionsByLotPrice(wallet, side) // side: desc/asc

    //   // balanceFlow(wallet, desiredWallet)
    //     // for(desiredPosition of desiredWallet) {
    //     //   find wallet[desiredPosition]
    //     //   recalculatePosition()
    //     // }

    //   expect(undefined).to.equal(undefined);
    // });
  });
});
