import 'dotenv/config';
import 'mocha';
import { expect } from 'chai';
import _ from 'lodash';
import { Wallet, DesiredWallet } from '../types.d';
import { normalizeDesire, addNumbersToWallet, balancer } from './index';

export const debug = require('debug')('bot').extend('balancer-test');

describe('bot', () => {
  describe('balancer', () => {
    it('Тест normalizeDezire', async () => {
      const desiredWallet: DesiredWallet = {
        AAPL: 100,
        USD: 50,
      };
      const normalizedDesire = normalizeDesire(desiredWallet);

      expect(normalizedDesire).to.deep.equal({ AAPL: 66.66666666666666, USD: 33.33333333333333 });
    });

    it('Тест сортировки по лотности', async () => {
      const desiredWallet: DesiredWallet = {
        TRUR: 50,
        TMOS: 50,
      };
      debug('desiredWallet', desiredWallet);

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
      debug('wallet', wallet);

      const walletWithNumbers = addNumbersToWallet(wallet);
      debug('addNumbersToWallet', addNumbersToWallet);

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

    it('Тест простой балансировки позиций только рублевых инструментов', async () => {
      const desiredWallet: DesiredWallet = {
        TRUR: 50,
        TMOS: 50,
        RUB: 0, // -1
      };
      debug('desiredWallet', desiredWallet);

      const walletInfo = {
        remains: 0,
      };
      debug('walletInfo', walletInfo);

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
      debug('wallet', wallet);

      await balancer(wallet, desiredWallet);

    });
  });
});
