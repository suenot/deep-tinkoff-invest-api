import 'dotenv/config';
import fs from 'fs';
// TODO: https://stackoverflow.com/questions/16316330/how-to-write-file-if-parent-folder-doesnt-exist

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
