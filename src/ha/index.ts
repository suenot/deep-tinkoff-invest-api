import { Ohlcv } from '../types.d';
import { HistoricCandle } from 'tinkoff-sdk-grpc-js/dist/generated/marketdata';

export const historicCandlesToOhlcv = (candles: HistoricCandle[]): Ohlcv[] => {
  return [
    {
      open: 1,
      high: 1,
      low: 1,
      close: 1,
      volume: 1,
      time: new Date(),
      isComplete: true,
    },
  ];
};

export const ohlcvToHeikenAshi = (ohlcv: Ohlcv[]): Ohlcv[] => {
  return ohlcv;
};
