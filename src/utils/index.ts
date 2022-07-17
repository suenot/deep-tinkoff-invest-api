import fs from 'fs';
import { TinkoffNumber } from '../types.d';

const debug = require('debug')('bot').extend('utils');

export const sleep = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

// TODO: Сделать запись не в корень проекта https://stackoverflow.com/questions/16316330/how-to-write-file-if-parent-folder-doesnt-exist
export const writeFile = (obj: object, filename: string) => {
  console.log(filename, JSON.stringify(obj, null, 2));
  const objStringify = JSON.stringify(obj, null, 2);

  const objExportedDefault = `export const data = ${objStringify}`;

  fs.writeFile(`${filename}Data.ts`, objExportedDefault, 'utf8', (err: any) => {
    if (err) return console.log(err);
    console.log('JSON file has been saved.');
  });
};

export const writeToFile = (obj: object, filename: string) => {
  console.log(filename, JSON.stringify(obj, null, 2));
  const objStringify = JSON.stringify(obj, null, 2);

  const objExportedDefault = `${objStringify}`;
  try {
    fs.appendFileSync(`${filename}Data.ts`, `\n\n${objExportedDefault}`, 'utf8');
  } catch(err) {
    console.log(err);
  }
};

export const convertTinkoffNumberToNumber = (n: TinkoffNumber): number => {
  debug('n', n);

  let result;
  if (n?.units ===  undefined) {
    result = Number(`0.${zeroPad(n?.nano, 9)}`);
  } else {
    result = Number(`${n.units}.${zeroPad(n?.nano, 9)}`);
  }
  debug('convertTinkoffNumberToNumber', result);
  return result;
};

export const convertNumberToTinkoffNumber = (n: number): TinkoffNumber => {
  const [units, nano] = n.toFixed(9).split('.').map(item => Number(item));
  return {
    units,
    nano,
  };
};

export const sumValues = obj => Object.values(obj).reduce((a: any, b: any) => a + b);

export const zeroPad = (num, places) => String(num).padStart(places, '0');
