import { inject, Injectable } from '@angular/core';
import csv from 'csvtojson';
import { SwDownloadService } from './sw-download.service';

@Injectable({
  providedIn: 'root'
})
export class ExportTablesService {
  private swDownload = inject(SwDownloadService);

  async localCsvToJson(csvText: string) {
    return new Promise(resolve => {
      const list: Wscols[] = [];
      let array: string[][] = [];
      csv({
        noheader: true,
        output: 'csv'
      })
        .fromString(csvText)
        .then((data: string[][]) => {
          array = data;
          array.forEach((row: string[], i: number) => {
            if (i == 0) return;
            const obj: Wscols = {} as Wscols;
            row.forEach((col: string, j: number) => {
              obj[array[0][j]] = array[i][j];
            });
            list.push(obj);
          });
          resolve(list);
        });
    });
  }

  async exportExcel(csvText: string, fileName: string, wscols?: Wscols[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.localCsvToJson(csvText).then(list => {
        import('xlsx').then(
          xlsx => {
            const worksheet = xlsx.utils.json_to_sheet(list as Wscols[], {
              skipHeader: Boolean(wscols?.length)
            });
            if (wscols) worksheet['!cols'] = wscols;
            const workbook = {
              Sheets: { data: worksheet },
              SheetNames: ['data']
            };
            const excelBuffer: ArrayBuffer = xlsx.write(workbook, {
              bookType: 'xlsx',
              type: 'array'
            });

            this.saveAsExcelFile(excelBuffer, fileName).then(
              () => resolve(),
              downloadErr => reject(downloadErr as Error)
            );
          },
          err => {
            reject(new Error(err));
          }
        );
      });
    });
  }

  private saveAsExcelFile(buffer: ArrayBuffer, fileName: string): Promise<void> {
    const EXCEL_TYPE =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    // Descarga via Service Worker (URL real) para sortear la CSP frame-src del
    // contenedor en Firefox; con fallback a FileSaver en navegadores sin SW.
    return this.swDownload.download(buffer, fileName + EXCEL_EXTENSION, EXCEL_TYPE);
  }
}

interface Wscols {
  [key: string]: string;
  // Aquí van las otras propiedades de Wscols
}
