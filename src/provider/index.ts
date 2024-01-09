import 'dotenv/config';
import { createSdk } from 'tinkoff-sdk-grpc-js';
// import { createSdk } from '../provider/invest-nodejs-grpc-sdk/src/sdk';
import 'mocha';
import _ from 'lodash';
import uniqid from 'uniqid';
// import { OrderDirection, OrderType } from '../provider/invest-nodejs-grpc-sdk/src/generated/orders';
import { OrderDirection, OrderType } from 'tinkoff-sdk-grpc-js/dist/generated/orders';
import { DESIRED_WALLET, BALANCE_INTERVAL, SLEEP_BETWEEN_ORDERS } from '../config';
import { Wallet, Position } from '../types.d';
import { sleep, writeFile, convertNumberToTinkoffNumber, convertTinkoffNumberToNumber } from '../utils';
import { balancer } from '../balancer';

(global as any).INSTRUMENTS = [];
(global as any).POSITIONS = [];
(global as any).LAST_PRICES = [];

const debug = require('debug')('bot').extend('provider');

const { orders, operations, marketData, users, instruments } = createSdk(process.env.TOKEN || '');

let ACCOUNT_ID: string;

export const provider = async () => {
  ACCOUNT_ID = await getAccountId(process.env.ACCOUNT_ID);
  await getInstruments();
  await getPositionsCycle();
};

export const generateOrders = async (wallet: Wallet) => {
  debug('generateOrders');
  for (const position of wallet) {
    await generateOrder(position);
  }
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
    // console.trace(err);
  }
  await sleep(SLEEP_BETWEEN_ORDERS);

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

export const getInstruments = async () => {

  debug('Получаем список акций');
  let sharesResult;
  try {
    sharesResult = await instruments.shares({
      // instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE,
    });
  } catch (err) {
    debug(err);
  }
  debug('sharesResult', sharesResult);
  const shares = sharesResult?.instruments;
  debug('shares', shares);
  (global as any).INSTRUMENTS = _.union(shares, (global as any).INSTRUMENTS);
  await sleep(SLEEP_BETWEEN_ORDERS);

  debug('Получаем список фондов');
  let etfsResult;
  try {
    etfsResult = await instruments.etfs({
      // instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE,
    });
  } catch (err) {
    debug(err);
  }
  debug('etfsResult', etfsResult);
  const etfs = etfsResult?.instruments;
  debug('etfs', etfs);
  (global as any).INSTRUMENTS = _.union(etfs, (global as any).INSTRUMENTS);
  await sleep(SLEEP_BETWEEN_ORDERS);

  debug('Получаем список облигаций');
  let bondsResult;
  try {
    bondsResult = await instruments.bonds({
      // instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE,
    });
  } catch (err) {
    debug(err);
  }
  debug('bondsResult', bondsResult);
  const bonds = bondsResult?.instruments;
  debug('bonds', bonds);
  (global as any).INSTRUMENTS = _.union(bonds, (global as any).INSTRUMENTS);
  await sleep(SLEEP_BETWEEN_ORDERS);

  debug('Получаем список валют');
  let currenciesResult;
  try {
    currenciesResult = await instruments.currencies({
      // instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE,
    });
  } catch (err) {
    debug(err);
  }
  debug('currenciesResult', currenciesResult);
  const currencies = currenciesResult?.instruments;
  debug('currencies', currencies);
  (global as any).INSTRUMENTS = _.union(currencies, (global as any).INSTRUMENTS);
  await sleep(SLEEP_BETWEEN_ORDERS);

  debug('Получаем список фьючерсов');
  let futuresResult;
  try {
    futuresResult = await instruments.futures({
      // instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE,
    });
  } catch (err) {
    debug(err);
  }
  debug('futuresResult', futuresResult);
  const futures = futuresResult?.instruments;
  debug('futures', futures);
  (global as any).INSTRUMENTS = _.union(futures, (global as any).INSTRUMENTS);
  await sleep(SLEEP_BETWEEN_ORDERS);

  debug('=========================');
};

export const getLastPrices = async () => {
  const lastPrices = (await marketData.getLastPrices({
    figi: [],
  }))?.lastPrices;
  debug('lastPrices', JSON.stringify(lastPrices, null, 2));
  const lastPricesFormatted = _.map(lastPrices, (item) => {
    item.price = convertTinkoffNumberToNumber(item.price);
    debug('fffff', convertTinkoffNumberToNumber(item.price));
    return item;
  });
  debug('lastPricesFormatted', JSON.stringify(lastPricesFormatted, null, 2));
  (global as any).LAST_PRICES = lastPricesFormatted;

  writeFile(lastPricesFormatted, 'lastPrices');
};
