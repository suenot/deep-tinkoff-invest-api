import 'dotenv/config';
import { createSdk } from './invest-nodejs-grpc-sdk/src/sdk';
import 'mocha';
import { expect } from 'chai';
import _ from 'lodash';
import uniqid from 'uniqid';
import { OrderDirection, OrderType } from './invest-nodejs-grpc-sdk/src/generated/orders';
import { InstrumentStatus } from './invest-nodejs-grpc-sdk/src/generated/instruments';
import { DESIRED_WALLET, BALANCE_INTERVAL, SLEEP_BETWEEN_ORDERS } from './config';
import { Wallet, DesiredWallet, TinkoffNumber, Position } from './types.d';

export const sleep = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

export const debug = require('debug')('bot').extend('balancer');
export const info = require('debug')('bot').extend('info');

const { orders, operations, marketData, users, instruments } = createSdk(process.env.TOKEN || '');

let ACCOUNT_ID;

(global as any).INSTRUMENTS = [];
(global as any).POSITIONS = [];

export const getInstruments = async () => {

  debug('Получаем список акций');
  let sharesResult;
  try {
    sharesResult = await instruments.shares({
      instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE,
    });
  } catch (err) {
    debug(err);
  }
  debug('sharesResult', sharesResult);

  const shares = sharesResult?.instruments;
  debug('shares', shares);

  (global as any).INSTRUMENTS = _.union(shares, (global as any).INSTRUMENTS);

  debug('Получаем список фондов');
  let etfsResult;
  try {
    etfsResult = await instruments.etfs({
      instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE,
    });
  } catch (err) {
    debug(err);
  }
  debug('etfsResult', etfsResult);

  const etfs = etfsResult?.instruments;
  debug('etfs', etfs);

  (global as any).INSTRUMENTS = _.union(etfs, (global as any).INSTRUMENTS);
};

export const getAccountId = async (type) => {
  if (type !== 'ISS' && type !== 'BROKER') {
    debug('Передан ACCOUNT_ID', type);
    return type;
  }

  debug('Получаем список аккаунтов');
  let accountsResult;
  try {
    accountsResult = await users.getAccounts({});
  } catch (err) {
    debug(err);
  }
  debug('accountsResult', accountsResult);

  const account = (type === 'ISS') ? _.find(accountsResult, { type: 2 }) : _.find(accountsResult, { type: 1 });
  debug('Найден ACCOUNT_ID', account);

  return account;
};

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
            accountId: ACCOUNT_ID,
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
            accountId: ACCOUNT_ID,
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
            lotPrice: convertNumberToTinkoffNumber(instrument.lot * convertTinkoffNumberToNumber(priceWhenAddToWallet)),
          };
          debug('corePosition', corePosition);
          coreWallet.push(corePosition);
        }

        debug(coreWallet);

        await balancer(coreWallet, DESIRED_WALLET);
        debug(`ITERATION #${count} FINISHED. TIME: ${new Date()}`);
        count++;
      },
      BALANCE_INTERVAL);
  });
};

export const main = async () => {
  ACCOUNT_ID = await getAccountId(process.env.ACCOUNT_ID);
  await getInstruments();
  await getPositionsCycle();
};

main();

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
  await sleep(SLEEP_BETWEEN_ORDERS);
  return lastPrice;
};

export const generateOrder = async (position: Position) => {
  debug('generateOrder');
  debug('position', position);

  if (position.base === 'RUB') {
    debug('Если позиция это рубль, то ничего не делаем');
    return false;
  }

  debug('Позиция не валюта');

  debug('position.toBuyLots', position.toBuyLots);

  if ((-1 < position.toBuyLots) && (position.toBuyLots < 1)) {
    debug('Выставление ордера меньше 1 лота. Не имеет смысла выполнять.');
    return 0;
  }

  debug('Позиция больше или равно 1 лоту');

  const direction = position.toBuyLots >= 1 ? OrderDirection.ORDER_DIRECTION_BUY : OrderDirection.ORDER_DIRECTION_SELL;
  debug('direction', direction);

  // for (const i of _.range(position.toBuyLots)) {
  //   // Идея создавать однолотовые ордера, для того, чтобы они всегда исполнялись полностью, а не частично.
  //   // Могут быть сложности с:
  //   // - кол-вом разрешенных запросов к api, тогда придется реализовывать очередь.
  //   // - минимальный ордер может быть больше одного лота
  //   debug(`Создаем однолотовый ордер #${i} of ${_.range(position.toBuyLots).length}`);
  //   const order = {
  //     accountId: ACCOUNT_ID,
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
  debug('position', position);

  debug('Создаем рыночный ордер');
  const order = {
    accountId: ACCOUNT_ID,
    figi: position.figi,
    quantity: Math.abs(position.toBuyLots), // Нужно указывать количество лотов, а не бумаг: https://tinkoff.github.io/investAPI/orders/#postorderrequest
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
  await sleep(SLEEP_BETWEEN_ORDERS);

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

  let result;
  if (n?.units ===  undefined) {
    result = Number(`0.${zeroPad(n?.nano, 9)}`);
  } else {
    result = Number(`${n.units}.${zeroPad(n?.nano, 9)}`);
  }
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

  const normalizedDesire = normalizeDesire(desiredWallet);

  debug('Добавляем в DesireWallet недостающие инструменты в портфеле со значением 0');
  for (const position of wallet) {
    if (normalizedDesire[position.base] === undefined) {
      debug(`${position.base} не найден в желаемом портфеле, добавляем со значением 0.`);
      normalizedDesire[position.base] = 0;
    }
  }

  for (const [desiredTicker, desiredPercent] of Object.entries(normalizedDesire)) {
    debug(' Ищем base (ticker) в wallet');
    const positionIndex = _.findIndex(wallet, { base: desiredTicker });
    debug('positionIndex', positionIndex);

    if (positionIndex === -1) {
      debug('В портфеле нету тикера из DesireWallet. Создаем.');

      const findedInstumentByTicker = _.find((global as any).INSTRUMENTS, { ticker: desiredTicker });
      debug(findedInstumentByTicker);

      const figi = findedInstumentByTicker?.figi;
      debug(figi);

      const lotSize = findedInstumentByTicker?.lot;
      debug(lotSize);

      const lastPrice = await getLastPrice(figi); // sleep внутри есть

      const newPosition = {
        pair: `${desiredTicker}/RUB`,
        base: desiredTicker,
        quote: 'RUB',
        figi,
        price: lastPrice,
        priceNumber: convertTinkoffNumberToNumber(lastPrice),
        amount: 0,
        lotSize,
        lotPrice: convertNumberToTinkoffNumber(lotSize * convertTinkoffNumberToNumber(lastPrice)),
      };
      debug('newPosition', newPosition);
      wallet.push(newPosition);
    }
  }

  debug('Рассчитываем totalPrice');
  const walletWithTotalPrice = _.map(wallet, (position: Position): Position => {
    debug('walletWithtotalPrice: map start: position', position);

    const lotPriceNumber = convertTinkoffNumberToNumber(position.lotPrice);
    debug('lotPriceNumber', lotPriceNumber);

    debug('position.amount, position.priceNumber');
    debug(position.amount, position.priceNumber);

    const totalPriceNumber = convertTinkoffNumberToNumber(position.price) * position.amount; // position.amount * position.priceNumber; //
    debug('totalPriceNumber', totalPriceNumber);

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

  for (const [desiredTicker, desiredPercent] of Object.entries(normalizedDesire)) {
    debug(' Ищем base (ticker) в wallet');
    const positionIndex = _.findIndex(sortedWallet, { base: desiredTicker });
    debug('positionIndex', positionIndex);

    // TODO:
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

    const position: Position = sortedWallet[positionIndex];
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

  debug('Сортируем ордера по возврастанию, чтобы сначала выполнить ордера на продажу, получить рубли, а уже потом выполнять ордера на покупку акций.');
  const sortedWalletsSellsFirst = _.orderBy(sortedWallet, ['toBuyNumber'], ['asc']);
  debug('sortedWalletsSellsFirst', sortedWalletsSellsFirst);

  debug('walletInfo', walletInfo);

  debug('Для всех позиций создаем необходимые ордера');
  await generateOrders(sortedWalletsSellsFirst);
};
