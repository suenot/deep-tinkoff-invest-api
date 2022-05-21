import 'dotenv/config';
import { createSdk } from '../sdk';
import { writefile } from '../utils';

!(async function example() {
  const { operations } = createSdk(process.env.TOKEN || '');

  //==============================================================================================================
  const userOperations = await operations.getOperations({
    accountId: process.env.ACCOUNT_ID,
    from: new Date('2020-01-05T07:00:00Z'),
    to: new Date(),
  });

  // console.log('Получение списка операций по счёту: ', userOperations);
  writefile(userOperations, 'getOperations');
  //==============================================================================================================

  //==============================================================================================================
  const portfolio = await operations.getPortfolio({
    accountId: process.env.ACCOUNT_ID,
  });

  // console.log('Получение портфеля по счёту: ', portfolio);
  writefile(portfolio, 'portfolio');
  //==============================================================================================================

  //==============================================================================================================
  const positions = await operations.getPositions({
    accountId: process.env.ACCOUNT_ID,
  });

  // console.log('Получение списка позиций по счёту: ', positions);
  writefile(positions, 'getPositions');
  //==============================================================================================================

  //==============================================================================================================
  const withDrawLimit = await operations.getWithdrawLimits({
    accountId: process.env.ACCOUNT_ID,
  });

  // console.log('Получение доступного остатка для вывода средств: ', withDrawLimit);
  // writefile(withDrawLimit, 'getWithdrawLimits');
  //==============================================================================================================

  //==============================================================================================================
  // const brokerReport = await operations.getBrokerReport({
  //   generateBrokerReportRequest: {
  //     accountId: process.env.ACCOUNT_ID,
  //     from: new Date('2020-01-01T07:00:00Z'),
  //     to: new Date(),
  //   },
  // });

  // const reportResponse = await operations.getBrokerReport({
  //   getBrokerReportRequest: {
  //     taskId: brokerReport.generateBrokerReportResponse?.taskId,
  //   },
  // });

  // console.log('Получение брокерского отчёта: ', reportResponse);
  // writefile(reportResponse, 'getBrokerReport');
  //==============================================================================================================

  //==============================================================================================================
  // const dividentsForeighIssuer = await operations.getDividendsForeignIssuer({
  //   generateDivForeignIssuerReport: {
  //     accountId: process.env.ACCOUNT_ID,
  //     from: new Date('2022-04-04T07:00:00Z'),
  //     to: new Date('2022-04-04T15:45:00Z'),
  //   },
  // });
  // writefile(dividentsForeighIssuer, 'getDividendsForeignIssuer');

  // const dfiResponse = await operations.getDividendsForeignIssuer({
  //   getDivForeignIssuerReport: {
  //     taskId: dividentsForeighIssuer.generateDivForeignIssuerReportResponse?.taskId,
  //   },
  // });

  // console.log('Получения отчёта "Справка о доходах за пределами РФ: ', dfiResponse);
  // writefile(dfiResponse, 'getDividendsForeignIssuer');
  //==============================================================================================================
})();
