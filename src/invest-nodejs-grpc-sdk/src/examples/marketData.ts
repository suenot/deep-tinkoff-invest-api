import 'dotenv/config';
import { createSdk } from '../sdk';
import { CandleInterval } from '../generated/marketdata';
import { writefile } from '../utils';

!(async function example() {
  const { marketData } = createSdk(process.env.TOKEN || '');

  //==============================================================================================================
  // const candles = await marketData.getCandles({
  //   figi: process.env.FIGI,
  //   from: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  //   to: new Date(),
  //   interval: CandleInterval.CANDLE_INTERVAL_15_MIN,
  // });

  // console.log('Запрос исторических свечей по инструменту: ', candles);
  // writefile(candles, 'getCandles');
  //==============================================================================================================

  //==============================================================================================================
  const lastPrice = await marketData.getLastPrices({
    figi: ['BBG000000001', 'BBG333333333'],
  });

  console.log('Запрос последних цен по инструментам: ', lastPrice);
  writefile(lastPrice, 'getLastPrices');
  //==============================================================================================================

  //==============================================================================================================
  // const orderBook = await marketData.getOrderBook({
  //   figi: process.env.FIGI,
  //   depth: 5,
  // });

  // console.log('Получение стакана по инструменту: ', orderBook);
  // writefile(orderBook, 'getOrderBook');
  //==============================================================================================================

  //==============================================================================================================
  // const tradingStatus = await marketData.getTradingStatus({
  //   figi: process.env.FIGI,
  // });

  // console.log('Запрос статуса торгов по инструментам: ', tradingStatus);
  // writefile(tradingStatus, 'getTradingStatus');
  //==============================================================================================================

  //==============================================================================================================
  // const lastTrades = await marketData.getLastTrades({
  //   figi: process.env.FIGI,
  //   from: new Date(Date.now() - 1 * 1 * 60 * 60 * 1000), // за 1 час
  //   to: new Date(),
  // });

  // console.log('Запрос статуса торгов по инструментам: ', lastTrades);
  // writefile(lastTrades, 'getLastTrades');
  //==============================================================================================================
})();
