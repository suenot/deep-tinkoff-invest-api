import 'dotenv/config';
import { createSdk } from '../sdk';
import { writefile } from '../utils';

!(async function example() {
  const { users } = createSdk(process.env.TOKEN || '');
  const userInfo = await users.getInfo({});
  const accounts = await users.getAccounts({});
  const tarrif = await users.getUserTariff({});
  // const marginAttr = await users.getMarginAttributes({ accountId: process.env.ACCCOUNT_ID });

  console.log('Информация о пользователе:', userInfo);
  writefile(userInfo, 'getInfo');
  console.log('Информация о счетах:', accounts);
  writefile(accounts, 'getAccounts');
  console.log('Информация о тарифе пользователя:', tarrif);
  writefile(tarrif, 'getUserTariff');
  // console.log('Данные маржинальных показателей по счёту', marginAttr);
  // writefile(marginAttr, 'marginAttr');
})();
