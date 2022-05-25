import 'dotenv/config';
import { createSdk } from './invest-nodejs-grpc-sdk/src/sdk';
import 'mocha';
import { expect } from 'chai';
import _ from 'lodash';
import uniqid from 'uniqid';
import { instruments } from './instrumentsData';
import { OrderDirection, OrderType } from './invest-nodejs-grpc-sdk/src/generated/orders';
import { desiredWallet as _desiredWallet, balancerInterval } from './config';
import { Wallet, DesiredWallet, TinkoffNumber, Position } from './types.d';

export const sleep = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

export const debug = require('debug')('bot').extend('balancer');

(global as any).INSTRUMENTS = instruments;
(global as any).POSITIONS = [];

export const getPositionsCycle = async () => {
  return await new Promise(() => {
    let count = 1;
    const interval = setInterval(
      async () => {

        let portfolio: any;
        let portfolioPositions: any;
        try {
          debug('Получение портфолио');
          portfolio = await operations.getPortfolio({
            accountId: process.env.ACCOUNT_ID,
          });
          debug('portfolio', portfolio);

          portfolioPositions = portfolio.positions;
          debug('portfolioPositions', portfolioPositions);
        } catch (err) {
          console.warn('Ошибка при получении портфолио');
          debug(err);
          console.trace(err);
        }

        let positions: any;
        try {
          debug('Получение позиций');
          positions = await operations.getPositions({
            accountId: process.env.ACCOUNT_ID,
          });
          debug('positions', positions);
        } catch (err) {
          console.warn('Ошибка при получении позиций');
          debug(err);
          console.trace(err);
        }

        const coreWallet: Wallet = [];

        debug('Добавляем валюты в Wallet');
        for (const currency of positions.money) {
          const corePosition = {
            pair: `${currency.currency.toUpperCase()}/${currency.currency.toUpperCase()}`,
            base: currency.currency.toUpperCase(),
            quote: currency.currency.toUpperCase(),
            figi: undefined,
            amount: currency.units,
            lotSize: 1,
            price: {
              units: 1,
              nano: 0,
            },
            priceNumber: 1,
            lotPrice: {
              units: 1,
              nano: 0,
            },
          };
          debug('corePosition', corePosition);
          coreWallet.push(corePosition);
        }

        (global as any).POSITIONS = portfolioPositions;

        debug('Добавляем позиции в Wallet');
        for (const position of portfolioPositions) {
          debug('position', position);

          const instrument = _.find((global as any).INSTRUMENTS,  { figi: position.figi });
          debug('instrument', instrument);

          const priceWhenAddToWallet = await getLastPrice(instrument.figi);
          debug('priceWhenAddToWallet', priceWhenAddToWallet);

          const corePosition = {
            pair: `${instrument.ticker}/${instrument.currency.toUpperCase()}`,
            base: instrument.ticker,
            quote: instrument.currency.toUpperCase(),
            figi: position.figi,
            amount: convertTinkoffNumberToNumber(position.quantity),
            lotSize: instrument.lot,
            price: priceWhenAddToWallet,
            priceNumber: convertTinkoffNumberToNumber(position.currentPrice),
            lotPrice: priceWhenAddToWallet, // TODO:// lotPrice: convertNumberToTinkoffNumber(convertTinkoffNumberToNumber(position.quantity) * instrument.lot * priceWhenAddToWallet),
          };
          debug('corePosition', corePosition);
          coreWallet.push(corePosition);
        }

        debug(coreWallet);

        await balancer(coreWallet, _desiredWallet);
        debug(`ITERATION #${count} FINISHED. TIME: ${new Date()}`);
        count++;
      },
      balancerInterval);
  });
};
getPositionsCycle();

const { orders, operations, marketData } = createSdk(process.env.TOKEN || '');

export const sumValues = obj => Object.values(obj).reduce((a: any, b: any) => a + b);

export const zeroPad = (num, places) => String(num).padStart(places, '0');

export const generateOrders = async (wallet: Wallet) => {
  debug('generateOrders');
  for (const position of wallet) {
    await generateOrder(position);
  }
};

export const getLastPrice = async (figi) => {
  debug('Получаем последнюю цену');
  let lastPriceResult;
  try {
    lastPriceResult = await marketData.getLastPrices({
      figi: [figi],
    });
    debug('lastPriceResult', lastPriceResult);
  } catch (err) {
    debug(err);
  }

  const lastPrice = lastPriceResult?.lastPrices?.[0]?.price;
  debug('lastPrice', lastPrice);
  return lastPrice;
}

export const generateOrder = async (position: Position) => {
  debug('generateOrder');
  debug('position', position);

  if (position.base === 'RUB') {
    debug('Если позиция это рубль, то ничего не делаем');
    return false;
  }

  debug('Позиция не валюта');

  const direction = position.toBuyLots > 0 ? OrderDirection.ORDER_DIRECTION_BUY : OrderDirection.ORDER_DIRECTION_SELL;
  if (position.toBuyLots === 0) {
    debug('Выставление нулевого ордера. Не имеет смысла выполнять.');
    return 0;
  }
  // for (const i of _.range(position.toBuyLots)) {
  //   // Идея создавать однолотовые ордера, для того, чтобы они всегда исполнялись полностью, а не частично.
  //   // Могут быть сложности с:
  //   // - кол-вом разрешенных запросов к api, тогда придется реализовывать очередь.
  //   // - минимальный ордер может быть больше одного лота
  //   debug(`Создаем однолотовый ордер #${i} of ${_.range(position.toBuyLots).length}`);
  //   const order = {
  //     accountId: process.env.ACCOUNT_ID,
  //     figi: position.figi,
  //     quantity: 1,
  //     // price: { units: 40, nano: 0 },
  //     direction,
  //     orderType: OrderType.ORDER_TYPE_MARKET,
  //     orderId: uniqid(),
  //   };
  //   debug('Отправляем ордер', order);

  //   try {
  //     const setOrder = await orders.postOrder(order);
  //     debug('Успешно поставили ордер', setOrder);
  //   } catch (err) {
  //     debug('Ошибка при выставлении ордера');
  //     debug(err);
  //     console.trace(err);
  //   }
  //   await sleep(1000);
  // }

  // Или можно создавать обычные ордера
  debug('Создаем рыночный ордер');
  const order = {
    accountId: process.env.ACCOUNT_ID,
    figi: position.figi,
    quantity: Math.abs(position.toBuyLots),
    // price: { units: 40, nano: 0 },
    direction,
    orderType: OrderType.ORDER_TYPE_MARKET,
    orderId: uniqid(),
  };
  debug('Отправляем рыночный ордер', order);

  try {
    const setOrder = await orders.postOrder(order);
    debug('Успешно поставили ордер', setOrder);
  } catch (err) {
    debug('Ошибка при выставлении ордера');
    debug(err);
    console.trace(err);
  }
  await sleep(1000);

};

export const normalizeDesire = (wallet: DesiredWallet): DesiredWallet => {
  debug('Нормализуем проценты, чтобы общая сумма была равна 100%, чтобы исключить человеческий фактор');
  debug('wallet', wallet);

  const walletSum: number = Number(sumValues(wallet));
  debug('walletSum', walletSum);

  const normalizedDesire = Object.entries(wallet).reduce((p, [k, v]) => ({ ...p, [k]: (Number(v) / walletSum * 100) }), {});
  debug('normalizedDesire', normalizedDesire);

  return normalizedDesire;
};

export const convertTinkoffNumberToNumber = (n: TinkoffNumber): number => {
  debug('n', n);
  const result = Number(`${n.units}.${zeroPad(n?.nano, 9)}`);
  debug('convertTinkoffNumberToNumber', result);
  return result;
};

export const convertNumberToTinkoffNumber = (n: number): TinkoffNumber => {
  const [units, nano] = n.toFixed(9).split('.').map(item => Number(item));
  return {
    units,
    nano,
  };
};

export const addNumbersToPosition = (position: Position): Position => {
  debug('addNumbersToPosition start');

  debug('position.price', position.price);
  position.priceNumber = convertTinkoffNumberToNumber(position.price);
  debug('position.priceNumber', position.priceNumber);

  debug('position.lotPrice', position.lotPrice);
  position.lotPriceNumber = convertTinkoffNumberToNumber(position.lotPrice);
  debug('position.lotPriceNumber', position.lotPriceNumber);

  debug('position.totalPrice', position.totalPrice);
  position.totalPriceNumber = convertTinkoffNumberToNumber(position.totalPrice);
  debug('position.totalPriceNumber', position.totalPriceNumber);

  debug('addNumbersToPosition end', position);
  return position;
};

export const addNumbersToWallet = (wallet: Wallet): Wallet => {
  for (let position of wallet) {
    position = addNumbersToPosition(position);
  }
  debug('addNumbersToWallet', wallet);
  return wallet;
};

export const balancer = async (positions: Wallet, desiredWallet: DesiredWallet) => {

  const walletInfo = {
    remains: 0,
  };

  const wallet = positions;

  for (const [desiredTicker, desiredPercent] of Object.entries(desiredWallet)) {
    debug(' Ищем base (ticker) в wallet');
    const positionIndex = _.findIndex(wallet, { base: desiredTicker });
    debug('positionIndex', positionIndex);

    if (positionIndex === -1) {
      debug('В портфеле нету тикера из DesireWallet. Создаем.');

      const findedFigiByTicker = _.find((global as any).INSTRUMENTS, { ticker: desiredTicker })?.figi;
      debug(findedFigiByTicker);

      const lastPrice = await getLastPrice(findedFigiByTicker);

      const newPosition = {
        pair: `${desiredTicker}/RUB`,
        base: desiredTicker,
        quote: 'RUB',
        figi: findedFigiByTicker,
        price: lastPrice,
        priceNumber: convertTinkoffNumberToNumber(lastPrice),
        amount: 0,
        lotSize: 1,
        lotPrice: lastPrice, // TODO:
      };
      debug('newPosition', newPosition);
      wallet.push(newPosition);
    }
  }

  debug('Рассчитываем totalPrice');
  const walletWithTotalPrice = _.map(wallet, (position: Position): Position => {
    debug('walletWithtotalPrice: map start: position', position);
    // const lotPriceNumber = convertTinkoffNumberToNumber(position.lotPrice);
    debug('position.amount, position.priceNumber');
    debug(position.amount, position.priceNumber);
    const totalPriceNumber = convertTinkoffNumberToNumber(position.price) * position.amount; // position.amount * position.priceNumber; //
    const totalPrice = convertNumberToTinkoffNumber(totalPriceNumber);
    position.totalPrice = totalPrice;
    debug('totalPrice', totalPrice);
    debug('walletWithtotalPrice: map end: position', position);
    return position;
  });

  const walletWithNumbers = addNumbersToWallet(walletWithTotalPrice);
  debug('addNumbersToWallet', addNumbersToWallet);

  const sortedWallet = _.orderBy(walletWithNumbers, ['lotPriceNumber'], ['desc']);
  debug('sortedWallet', sortedWallet);

  debug('Суммируем все позиции в портефле');
  const walletSumNumber = _.sumBy(sortedWallet, 'totalPriceNumber');
  debug(sortedWallet);
  debug('walletSumNumber', walletSumNumber);

  for (const [desiredTicker, desiredPercent] of Object.entries(desiredWallet)) {
    debug(' Ищем base (ticker) в wallet');
    const positionIndex = _.findIndex(sortedWallet, { base: desiredTicker });
    debug('positionIndex', positionIndex);

    // const position: Position;
    // if (positionIndex === -1) {
    //   debug('В портфеле нету тикера из DesireWallet. Создаем.');
    //   const newPosition = {
    //     pair: `${desiredTicker}/RUB`,
    //     base: desiredTicker,
    //     quote: 'RUB',
    //     figi: _.find((global as any).INSTRUMENTS, { ticker: desiredTicker })?.figi,
    //     amount: 0,
    //     lotSize: 1,
    //     // price: _.find((global as any).INSTRUMENTS, { ticker: desiredTicker })?.price, // { units: 1, nano: 0 },
    //     // lotPrice: { units: 1, nano: 0 },
    //     // totalPrice: { units: 1, nano: 0 },
    //   };
    //   sortedWallet.push(newPosition);
    //   positionIndex = _.findIndex(sortedWallet, { base: desiredTicker });
    // }

    debug('В портфеле есть тикера из DesireWallet');
    const position = sortedWallet[positionIndex];
    debug('position', position);

    debug('Рассчитываем сколько в рублях будет ожидаемая доля (допустим, 50%)');
    debug('walletSumNumber', walletSumNumber);
    debug('desiredPercent', desiredPercent);
    const desiredAmountNumber = walletSumNumber / 100 * desiredPercent;
    debug('desiredAmountNumber', desiredAmountNumber);
    position.desiredAmountNumber = desiredAmountNumber;

    debug('Высчитываем сколько лотов можно купить до желаемого таргета');
    const canBuyBeforeTargetLots = Math.trunc(desiredAmountNumber / position.lotPriceNumber);
    debug('canBuyBeforeTargetLots', canBuyBeforeTargetLots);
    position.canBuyBeforeTargetLots = canBuyBeforeTargetLots;

    debug('Высчитываем стоимость позиции, которую можно купить до желаемого таргета');
    const canBuyBeforeTargetNumber = canBuyBeforeTargetLots * position.lotPriceNumber;
    debug('canBuyBeforeTargetNumber', canBuyBeforeTargetNumber);
    position.canBuyBeforeTargetNumber = canBuyBeforeTargetNumber;

    debug('Высчитываем разницу между желаемым значением и значением до таргета. Нераспеределенный остаток.');
    const beforeDiffNumber = Math.abs(desiredAmountNumber - canBuyBeforeTargetNumber);
    debug('beforeDiffNumber', beforeDiffNumber);
    position.beforeDiffNumber = beforeDiffNumber;

    debug('Суммируем остатки'); // TODO: нужно определить валюту и записать остаток в этой валюте
    walletInfo.remains += beforeDiffNumber; // Пока только в рублях

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

  debug('Для всех позиций создаем необходимые ордера');
  await generateOrders(sortedWallet);
};
