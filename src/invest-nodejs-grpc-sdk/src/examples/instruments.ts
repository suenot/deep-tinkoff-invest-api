import 'dotenv/config';
import { createSdk } from '../sdk';
import { InstrumentIdType, InstrumentStatus } from '../generated/instruments';
import { writefile } from '../utils';

!(async function example() {
  const { instruments } = createSdk(process.env.TOKEN || '');

  //==============================================================================================================
  // const schedule = await instruments.tradingSchedules({
  //   from: new Date(),
  //   to: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
  //   exchange: 'MOEX',
  // });
  // const scheduleAll = await instruments.tradingSchedules({
  //   from: new Date(),
  //   to: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
  // }); // биржа не указана

  // console.log('Расписание торгов Московской биржи в указанном временном промежутке: ', schedule.exchanges[0]);
  // console.log('Расписание торгов всех бирж в указанном временном промежутке: ', scheduleAll.exchanges);
  // writefile(scheduleAll, 'tradingSchedules');
  //==============================================================================================================

  //==============================================================================================================
  // const bonds = await instruments.bonds({ instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE }); // instrumentStatus выбран здесь тот, который показывает бонды доступные к торговле в API
  // const bondByFIGI = await instruments.bondBy({
  //   idType: InstrumentIdType.INSTRUMENT_ID_TYPE_FIGI,
  //   id: 'BBG011FHF1F7',
  // });
  // const bondCoupons = await instruments.getBondCoupons({
  //   figi: 'BBG011FHF1F7',
  //   from: new Date('2022-01-01T00:00:00Z'),
  //   to: new Date('2022-12-31:20:55:59Z'),
  // });

  // const accruedInterests = await instruments.getAccruedInterests({
  //   figi: 'BBG011FHF1F7',
  //   from: new Date('2022-01-01T00:00:00Z'),
  //   to: new Date('2022-01-31:20:55:59Z'),
  // });

  // console.log('Список облигаций, которыми можно торговать с помощью API: ', bonds);
  // console.log('Получение информации об облигации по FIGI: ', bondByFIGI);
  // console.log('Получение графика выплат купонов по облигации: ', bondCoupons);
  // console.log('Получение накопленного купонного дохода по FIGI облигации: ', accruedInterests);
  //==============================================================================================================

  //==============================================================================================================
  // const currencies = await instruments.currencies({
  //   instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE, // instrumentStatus выбран здесь тот, который показывает валюты доступные к торговле в API
  // });
  // const currencyByFIGI = await instruments.currencyBy({
  //   idType: InstrumentIdType.INSTRUMENT_ID_TYPE_FIGI,
  //   id: 'BBG0013HGFT4',
  //   classCode: 'CETS',
  // });

  // console.log('Получения списка валют, допущенных к торговле через API: ', currencies);
  // writefile(currencies, 'currencies');
  // console.log('Получения информации о конкретной валюте, по FIGI: ', currencyByFIGI);
  // writefile(currencyByFIGI, 'currencyBy');
  // //==============================================================================================================

  // //==============================================================================================================
  // const etfs = await instruments.etfs({
  //   instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE,
  // });
  // const etfByFIGI = await instruments.etfBy({
  //   idType: InstrumentIdType.INSTRUMENT_ID_TYPE_FIGI,
  //   id: 'BBG00NRFC2X2',
  // });

  // console.log('Получения ETF, допущенных к торговле через API: ', etfs);
  // writefile(etfs, 'etfs');
  // console.log('Получение информации о ETF по его FIGI: ', etfByFIGI);
  // writefile(etfByFIGI, 'etfBy');
  //==============================================================================================================

  //==============================================================================================================
  // const futures = await instruments.futures({
  //   instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE,
  // });
  // const futureByFIGI = await instruments.futureBy({
  //   idType: InstrumentIdType.INSTRUMENT_ID_TYPE_FIGI,
  //   id: 'FUTSI0623000',
  // });

  // const futuresMargin = await instruments.getFuturesMargin({
  //   figi: 'FUTSI0623000',
  // });

  // console.log('Получения фьючерсов, допущенных к торговле через API: ', futures);
  // console.log('Получение информации о фьючерсе по его FIGI: ', futureByFIGI);
  // console.log('Получение размера гарантийного обеспечения по фьючерсу: ', futuresMargin);
  //==============================================================================================================

  //==============================================================================================================
  const shares = await instruments.shares({
    instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE,
  });
  console.log('Получение списка акций, допущенных к торговле через API: ', shares);
  writefile(shares, 'shares');

  const shareByFIGI = await instruments.shareBy({
    idType: InstrumentIdType.INSTRUMENT_ID_TYPE_FIGI,
    id: 'BBG004730ZJ9',
  });
  console.log('Получение информации об акции по её FIGI: ', shareByFIGI);
  writefile(shareByFIGI, 'shareBy');
  //==============================================================================================================

  //==============================================================================================================
  // const instrument = await instruments.getInstrumentBy({
  //   idType: InstrumentIdType.INSTRUMENT_ID_TYPE_FIGI,
  //   id: 'BBG005DXJS36',
  // });

  // const dividends = await instruments.getDividends({
  //   figi: 'BBG0047315Y7',
  //   from: new Date(),
  //   to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  // });

  // console.log('Получение основной информации об инструменте: ', instrument);
  // writefile(instrument, 'getInstrumentBy');
  // console.log('Получение событий выплаты дивидендов по инструменту: ', dividends);
  // writefile(dividends, 'getDividends');
  //==============================================================================================================

  //==============================================================================================================
  const assets = await instruments.getAssets({});

  console.log('Получение списка активов: ', assets);
  writefile(assets, 'getAssets');

  // const assetsByID = await instruments.getAssetBy({ id: '09411d72-f4f2-4dad-a494-3d91be1dabd8' });
  // console.log('Получение актива по его идентификатору: ', assetsByID);
  // writefile(assetsByID, 'getAssetBy');
  // //==============================================================================================================
})();
