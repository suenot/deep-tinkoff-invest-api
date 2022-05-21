import { CallCredentials, ChannelCredentials, credentials, Metadata } from '@grpc/grpc-js';
import { createChannel } from 'nice-grpc';
import { APP_NAME } from './constants';
import 'dotenv/config';
import fs from 'fs';

export const createMetadata = (token: string): Metadata => {
  const metadata = new Metadata();
  metadata.add('Authorization', `Bearer ${token}`);
  metadata.add('x-app-name', APP_NAME);

  return metadata;
};

export const createMetadataCredentials = (metadata: Metadata): CallCredentials =>
  credentials.createFromMetadataGenerator(function (args: any, callback: any) {
    callback(null, metadata);
  });

export const createSSLCredentials = (metadataCreds: CallCredentials): ChannelCredentials =>
  credentials.combineChannelCredentials(credentials.createSsl(), metadataCreds);

export const makeChannel = (url: string, ssl_creds: ChannelCredentials) => createChannel(url, ssl_creds);

// TODO: Сделать запись не в корень проекта https://stackoverflow.com/questions/16316330/how-to-write-file-if-parent-folder-doesnt-exist
export const writefile = (obj: object, filename: string) => {
  console.log(filename, JSON.stringify(obj, null, 2));
  const objStringify = JSON.stringify(obj, null, 2);

  const objExportedDefault = `export const data = ${objStringify}`;

  fs.writeFile(`${filename}Data.ts`, objExportedDefault, 'utf8', (err: any) => {
    if (err) return console.log(err);
    console.log("JSON file has been saved.");
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

