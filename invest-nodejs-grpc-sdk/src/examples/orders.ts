import 'dotenv/config';
import { createSdk } from '../sdk';
import { OrderDirection, OrderType } from '../generated/orders';
import { writefile } from '../utils';

!(async function example() {
  const { orders } = createSdk(process.env.TOKEN || '');

  //==============================================================================================================
  const ordersResponse = await orders.getOrders({
    accountId: process.env.ACCOUNT_ID,
  });

  console.log('Получение списка активных заявок по счёту: ', ordersResponse);
  writefile(ordersResponse, 'getOrders');
  //==============================================================================================================

  //==============================================================================================================
  // const setOrder = await orders.postOrder({
  //   accountId: process.env.ACCOUNT_ID,
  //   figi: process.env.FIGI || '',
  //   quantity: 1,
  //   price: { units: 40, nano: 0 },
  //   direction: OrderDirection.ORDER_DIRECTION_SELL,
  //   orderType: OrderType.ORDER_TYPE_LIMIT,
  //   orderId: 'd1e5d152-d36e-4019-93cc-3a5db6c14f9f',
  // });

  // console.log('Выставление заявки: ', setOrder);
  // writefile(setOrder, 'postOrder');
  //==============================================================================================================

  //==============================================================================================================
  // const orderState = await orders.getOrderState({
  //   accountId: process.env.ACCOUNT_ID,
  //   orderId: setOrder.orderId,
  // });

  // console.log('Получение статуса торгового поручения: ', orderState);
  // writefile(orderState, 'getOrderState');
  //==============================================================================================================

  //==============================================================================================================
  const cancelOrder = await orders.cancelOrder({
    accountId: process.env.ACCOUNT_ID,
    orderId: '414442596860',
  });

  console.log('Отмена биржевой заявки: ', cancelOrder);
  writefile(cancelOrder, 'cancelOrder');
  //==============================================================================================================
})();
