import 'dotenv/config';
import 'mocha';
import { expect } from 'chai';
import _ from 'lodash';
// import uniqid from 'uniqid';

const debug = require('debug')('bot').extend('balancer');

const sumValues = obj => Object.values(obj).reduce((a: number, b: number) => a + b);

interface Wallet {
  [key: string]: Number;
}

const normalizeDesire = (wallet: Wallet): Wallet => {
  debug('Нормализуем проценты, чтобы общая сумма была равна 100%, чтобы исключить человеческий фактор');
  debug('wallet', wallet);

  const walletSum: number = Number(sumValues(wallet));
  debug('walletSum', walletSum);

  const normalizedDesire = Object.entries(wallet).reduce((p, [k, v]) => ({ ...p, [k]: (Number(v) / walletSum * 100) }), {});
  debug('normalizedDesire', normalizedDesire);

  return normalizedDesire;
};

describe('bot', () => {
  describe('balancer', () => {
          // const wallet = {
      //   AAPL: 2,
      //   USD: 1000,
      // };
    it.only('Test normalizeDezire', async () => {
      const desiredWallet = {
        AAPL: 100,
        USD: 50,
      };
      const normalizedDesire = normalizeDesire(desiredWallet);

      expect(normalizedDesire).to.deep.equal({ AAPL: 66.66666666666666, USD: 33.33333333333333 });
    });

    it.skip('#1', async () => {
      // Нужно узнать лотность и последнюю ценю
      // Использовать данные последних цен
      // Лотность берется из инструмента
      const wallet = {
        AAPL: 2,
        USD: 1000,
      };
      const desiredWallet = {
        AAPL: 100,
        USD: 50,
      };
      const normalizedDesire = normalizeDesire(desiredWallet);



      expect(undefined).to.equal(undefined);
    })
  })
})
