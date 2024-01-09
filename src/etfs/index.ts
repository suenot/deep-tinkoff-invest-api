import 'dotenv/config';
import { createSdk } from 'tinkoff-sdk-grpc-js/src/sdk';
import { InstrumentStatus } from 'tinkoff-sdk-grpc-js/dist/generated/instruments';
// import { createSdk } from '../provider/invest-nodejs-grpc-sdk/src/sdk';
// import { InstrumentStatus } from '../provider/invest-nodejs-grpc-sdk/src/generated/instruments';
import _ from 'lodash';
import { SLEEP_BETWEEN_ORDERS } from '../config';
import { convertTinkoffNumberToNumber, writeFile } from '../utils/index';
import { getLastPrices, getInstruments } from '../provider/index';
import './store';
// import uniqid from 'uniqid';

export const sleep = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

// https://www.tinkoff.ru/invest/catalog/etfs/tinkoff-capital/?orderType=Desc&sortType=ByEarnings6m&start=0&end=12
const tinkoffsFunds = [
  'TGLD',
  'TSPV',
  'TBRU',
  'TUSD',
  'TEUR',
  'TEMS',
  'TSPX',
  'TEUS',
  'TBUY',
  'TBEU',
  'TRUR',
  'TPAS',
  'TBIO',
  'TCBR',
  'TECH',
  'TSST',
  'TGRN',
  'TSOX',
  'TRAI',
  'TIPO',
  'TFNX',
  'TMOS',
];

import { data } from './data/TRUR';

const debug = require('debug')('bot').extend('balancer');

const main = async () => {
  await getInstruments();
  await getLastPrices();

  // // 1. Axios get https://www.tinkoff.ru/api/invest-gw/capital/funds/v1/portfolio/structure?ticker=TRUR

  // // 2. Посчитать сумму стоимости всех инструментов в портфеле.
  const etf_instruments = data.payload.instruments;
  // // debug(instruments);

  for (let position of etf_instruments) {
    if (position.ticker) {
      debug(position.ticker);
      const findedInstumentByTicker = _.find((global as any).INSTRUMENTS, { ticker: position.ticker });
      debug('findedInstumentByTicker', findedInstumentByTicker);
      const figi = findedInstumentByTicker.figi;
      debug('figi', figi);
      const lastPriceData = _.find((global as any).LAST_PRICES, { figi });
      debug('lastPriceData', lastPriceData);

      position = {
        ...position,
        ...findedInstumentByTicker,
        price: lastPriceData?.price,
        priceTime: lastPriceData?.time,
        total: lastPriceData?.price * position.value,
      };
      debug('position', position);
    }
  }

};

main();
