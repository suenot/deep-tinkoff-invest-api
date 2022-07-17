import { provider } from './provider/index';
// import { balancer } from './balancer/index';
// import { DESIRED_WALLET } from './config';
const debug = require('debug')('bot').extend('main');

const main = async () => {
  debug('main start');
  await provider();
  // TODO: сейчас balancer вызывается из provider, а не из main. Нужно переделать.
  // debug('provider done');
  // await balancer((global as any).POSITIONS, DESIRED_WALLET);
};

main();
