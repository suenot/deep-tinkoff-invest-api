# Deep-tinkoff-invest-api package
This package is work in progress.

### Account
![Account scheme](./src/account/Account.drawio.svg)

Tinkoff invest api methods:
- [GetAccounts](https://tinkoff.github.io/investAPI/users/#getaccounts)

### Instrument
![Instrument scheme](./src/instrument/Instrument.drawio.svg)

Tinkoff invest api methods:
- [GetInstrumentBy](https://tinkoff.github.io/investAPI/instruments/#getinstrumentby)
- [Shares](https://tinkoff.github.io/investAPI/instruments/#shares)
- [Etfs](https://tinkoff.github.io/investAPI/instruments/#etfs)

### Position
![Position scheme](./src/position/Position.drawio.svg)

Tinkoff invest api methods:
- [GetPositions](https://tinkoff.github.io/investAPI/operations/#getpositions)

### Candle
![Candle scheme](./src/candle/Candle.drawio.svg)

Tinkoff invest api methods:
- [GetCandles](https://tinkoff.github.io/investAPI/marketdata/#getcandles)

### OrderBook
![OrderBook scheme](./src/orderbook/OrderBook.drawio.svg)

Tinkoff invest api methods:
- [GetOrderBook](https://tinkoff.github.io/investAPI/marketdata/#getorderbook)

### Order
Orders from the marker and from users are the same stucture.

![Order scheme](./src/order/Order.drawio.svg)

Tinkoff invest api methods:
- [PostOrder](https://tinkoff.github.io/investAPI/orders/#postorder)
- [CancelOrder](https://tinkoff.github.io/investAPI/orders/#cancelorder)
- [GetOrderState](https://tinkoff.github.io/investAPI/orders/#getorderstate)
- [GetOrders](https://tinkoff.github.io/investAPI/orders/#getorders)

### Operation
Trades from the marker and from users are the same stucture.
Operations will be combined with Orders.
Maybe Trades will be renamed to Transactions.

![Trade scheme](./src/trade/Trade.drawio.svg)

Tinkoff invest api methods:
- [GetLastTrades](https://tinkoff.github.io/investAPI/marketdata/#getlasttrades) - Метод запроса последних обезличенных сделок по инструменту.
- [GetOperations](https://tinkoff.github.io/investAPI/operations/#getoperations) - Метод получения списка операций по счёту.
