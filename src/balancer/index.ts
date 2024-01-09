import 'dotenv/config';
import { createSdk } from 'tinkoff-sdk-grpc-js/src/sdk';
// import { createSdk } from '../provider/invest-nodejs-grpc-sdk/src/sdk';
import 'mocha';
import _ from 'lodash';
import uniqid from 'uniqid';
import { OrderDirection, OrderType } from 'tinkoff-sdk-grpc-js/dist/generated/orders';
// import { OrderDirection, OrderType } from '../provider/invest-nodejs-grpc-sdk/src/generated/orders';
import { SLEEP_BETWEEN_ORDERS } from '../config';
import { Wallet, DesiredWallet, Position } from '../types.d';
import { getLastPrice, generateOrders } from '../provider';
import { sumValues, convertNumberToTinkoffNumber, convertTinkoffNumberToNumber } from '../utils';

const debug = require('debug')('bot').extend('balancer');

// const { orders, operations, marketData, users, instruments } = createSdk(process.env.TOKEN || '');


export const normalizeDesire = (wallet: DesiredWallet): DesiredWallet => {
  debug('Нормализуем проценты, чтобы общая сумма была равна 100%, чтобы исключить человеческий фактор');
  debug('wallet', wallet);

  const walletSum: number = Number(sumValues(wallet));
  debug('walletSum', walletSum);

  const normalizedDesire = Object.entries(wallet).reduce((p, [k, v]) => ({ ...p, [k]: (Number(v) / walletSum * 100) }), {});
  debug('normalizedDesire', normalizedDesire);

  return normalizedDesire;
};

// TODO: remove
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

// TODO: remove
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
