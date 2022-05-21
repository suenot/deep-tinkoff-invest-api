import 'dotenv/config';
import { createSdk } from '../sdk';
import { writefile } from '../utils';

!(async function example() {
  const { stopOrders } = createSdk(process.env.TOKEN || '');

  //==============================================================================================================
  const setStopOrder = await stopOrders.postStopOrder({
    accountId: process.env.ACCOUNT_ID,
    figi: process.env.FIGI,
    quantity: 1,
    price: { units: 40, nano: 0 },
    stopPrice: { units: 40, nano: 0},
    direction: 2,
    expirationType: 1,
    stopOrderType: 1,
    // expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  console.log('Выставление стоп-заявки: ', setStopOrder);
  writefile(setStopOrder, 'postStopOrder');
  //==============================================================================================================

  //==============================================================================================================
  const stopOrderResponse = await stopOrders.getStopOrders({ accountId: process.env.ACCOUNT_ID });

  console.log('Получение списка активных стоп заявок по счёту: ', stopOrderResponse);
  writefile(stopOrderResponse, 'getStopOrders');
  //==============================================================================================================

  //==============================================================================================================
  const cancelStopOrder = await stopOrders.cancelStopOrder({
    accountId: process.env.ACCOUNT_ID,
    stopOrderId: setStopOrder.stopOrderId,
  });

  console.log('Отмена стоп-заявки: ', cancelStopOrder);
  writefile(cancelStopOrder, 'cancelStopOrder');
  //==============================================================================================================

})();
