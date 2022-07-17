import 'dotenv/config';
import { createSdk } from '../sdk';
import { DeepPartial, MarketDataRequest, SubscriptionAction, SubscriptionInterval } from '../generated/marketdata';
import { writeToFile } from '../utils';

// export const runMarketDataStream = async () => {
!(async function example() {
  const { marketDataStream } = createSdk(process.env.TOKEN || '');

  let keepCalling = true;

  // setTimeout(function () {
  //   keepCalling = false;
  // }, 15000);

  const timer = (time: number) => new Promise(resolve => setTimeout(resolve, time));

  //генератор для последней цены инструмента и свечей
  async function* createRequest(): AsyncIterable<DeepPartial<MarketDataRequest>> {
    while (keepCalling) {
      await timer(1000);
      yield MarketDataRequest.fromPartial({
        subscribeLastPriceRequest: {
          subscriptionAction: SubscriptionAction.SUBSCRIPTION_ACTION_SUBSCRIBE,
          instruments: [{ figi: process.env.FIGI || '' }],
        },
      });
      await timer(1000);
      yield MarketDataRequest.fromPartial({
        subscribeCandlesRequest: {
          subscriptionAction: SubscriptionAction.SUBSCRIPTION_ACTION_SUBSCRIBE,
          instruments: [{ figi: process.env.FIGI || '', interval: SubscriptionInterval.SUBSCRIPTION_INTERVAL_ONE_MINUTE }],
        },
      });
      await timer(1000);
      yield MarketDataRequest.fromPartial({
        subscribeOrderBookRequest: {
          subscriptionAction: SubscriptionAction.SUBSCRIPTION_ACTION_SUBSCRIBE,
          instruments: [{ figi: process.env.FIGI || '', depth: 100 }],
        },
      });
      await timer(1000);
      yield MarketDataRequest.fromPartial({
        subscribeInfoRequest: {
          subscriptionAction: SubscriptionAction.SUBSCRIPTION_ACTION_SUBSCRIBE,
          instruments: [{ figi: process.env.FIGI || '' }],
        },
      });
      await timer(1000);
      yield MarketDataRequest.fromPartial({
        subscribeTradesRequest: {
          subscriptionAction: SubscriptionAction.SUBSCRIPTION_ACTION_SUBSCRIBE,
          instruments: [{ figi: process.env.FIGI || '' }],
        },
      });
    }
  }

  const response = marketDataStream.marketDataStream(createRequest());

  for await (const num of response) {
    // TODO: write to rxjs subject
    if (num?.orderbook) {
      console.log(num?.orderbook);
      writeToFile(num?.orderbook, 'streamOrderBookData');
    }
    if (num?.candle) {
      console.log(num?.candle);
      writeToFile(num?.candle, 'streamCandleData');
    }
    if (num?.lastPrice) {
      console.log(num?.lastPrice);
      writeToFile(num?.lastPrice, 'streamLastPriceData');
    }
    if (num?.trade) {
      console.log(num?.trade);
      writeToFile(num?.trade, 'streamTradeData');
    }
    if (num?.tradingStatus) {
      console.log(num?.tradingStatus);
      writeToFile(num?.tradingStatus, 'streamTradingStatusData');
    }
  }
// }
})();
