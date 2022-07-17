import { historicCandlesToOhlcv, ohlcvToHeikenAshi } from './index';
// import { Ohlcv } from '../types.d';
import { HistoricCandle } from '../provider/invest-nodejs-grpc-sdk/src/generated/marketdata';

const testCandles: HistoricCandle[] = [
  {
    open: {
      units: 38,
      nano: 0,
    },
    high: {
      units: 38,
      nano: 0,
    },
    low: {
      units: 37,
      nano: 980000000,
    },
    close: {
      units: 37,
      nano: 980000000,
    },
    volume: 258,
    time: new Date('2022-05-20T21:00:00.000Z'),
    isComplete: true,
  },
  {
    open: {
      units: 37,
      nano: 970000000,
    },
    high: {
      units: 37,
      nano: 970000000,
    },
    low: {
      units: 37,
      nano: 970000000,
    },
    close: {
      units: 37,
      nano: 970000000,
    },
    volume: 120,
    time: new Date('2022-05-20T21:15:00.000Z'),
    isComplete: true,
  },
  {
    open: {
      units: 38,
      nano: 200000000,
    },
    high: {
      units: 38,
      nano: 200000000,
    },
    low: {
      units: 38,
      nano: 200000000,
    },
    close: {
      units: 38,
      nano: 200000000,
    },
    volume: 50,
    time: new Date('2022-05-20T21:30:00.000Z'),
    isComplete: true,
  },
  {
    open: {
      units: 38,
      nano: 140000000,
    },
    high: {
      units: 38,
      nano: 230000000,
    },
    low: {
      units: 38,
      nano: 140000000,
    },
    close: {
      units: 38,
      nano: 230000000,
    },
    volume: 4,
    time: new Date('2022-05-20T21:45:00.000Z'),
    isComplete: false,
  },
];

const testOhlcvs = historicCandlesToOhlcv(testCandles);

const testHA = ohlcvToHeikenAshi(testOhlcvs);
