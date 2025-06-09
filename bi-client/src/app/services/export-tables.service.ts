import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExportTablesService {
  /**
   * Convierte CSV a array de objetos de forma más robusta
   */
  private csvToArray(csvText: string): any[] {
    try {
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) {
        throw new Error('CSV vacío o inválido');
      }

      const headers = this.parseCSVLine(lines[0]);
      const data: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
      }

      return data;
    } catch (error) {
      console.error('Error al procesar CSV:', error);
      throw new Error(`Error al procesar CSV: ${error}`);
    }
  }

  /**
   * Parsea una línea CSV considerando comillas y comas dentro de campos
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Exporta datos CSV a Excel con mejor manejo de errores
   */
  async exportExcel(csvText: string, fileName: string, wscols?: Wscols[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Validaciones iniciales
        if (!csvText || csvText.trim() === '') {
          throw new Error('No hay datos para exportar');
        }

        if (!fileName || fileName.trim() === '') {
          throw new Error('Nombre de archivo inválido');
        }

        console.log('Iniciando exportación de Excel...');

        // Procesar CSV
        const data = this.csvToArray(csvText);

        if (data.length === 0) {
          throw new Error('No se encontraron datos válidos en el CSV');
        }

        console.log(`Procesados ${data.length} registros`);

        // Importar XLSX de forma dinámica
        const xlsx = await import('xlsx');

        // Crear worksheet
        const worksheet = xlsx.utils.json_to_sheet(data, {
          skipHeader: Boolean(wscols?.length)
        });

        // Aplicar configuración de columnas si existe
        if (wscols && wscols.length > 0) {
          worksheet['!cols'] = wscols;
        }

        // Crear workbook
        const workbook = {
          Sheets: { Datos: worksheet },
          SheetNames: ['Datos']
        };

        console.log('Generando archivo Excel...');

        // Generar buffer
        const excelBuffer: ArrayBuffer = xlsx.write(workbook, {
          bookType: 'xlsx',
          type: 'array'
        });

        // Guardar archivo
        await this.saveAsExcelFile(excelBuffer, fileName);

        console.log('Archivo Excel exportado exitosamente');
        resolve();
      } catch (error) {
        console.error('Error en exportExcel:', error);
        reject(
          new Error(
            `Error al exportar Excel: ${
              error instanceof Error ? error.message : 'Error desconocido'
            }`
          )
        );
      }
    });
  }

  /**
   * Guarda el buffer como archivo Excel
   */
  private async saveAsExcelFile(buffer: ArrayBuffer, fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const EXCEL_TYPE =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const EXCEL_EXTENSION = '.xlsx';

        // Limpiar nombre de archivo
        const cleanFileName = fileName.replace(/[^a-z0-9_-]/gi, '_');

        const data: Blob = new Blob([buffer], {
          type: EXCEL_TYPE
        });

        FileSaver.saveAs(data, cleanFileName + EXCEL_EXTENSION);
        resolve();
      } catch (error) {
        reject(new Error(`Error al guardar archivo: ${error}`));
      }
    });
  }

  /**
   * Método alternativo: exportar directamente desde datos JSON
   */
  async exportExcelFromJson(
    data: any[],
    fileName: string,
    sheetName: string = 'Datos'
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!data || data.length === 0) {
          throw new Error('No hay datos para exportar');
        }

        const xlsx = await import('xlsx');

        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = {
          Sheets: { [sheetName]: worksheet },
          SheetNames: [sheetName]
        };

        const excelBuffer: ArrayBuffer = xlsx.write(workbook, {
          bookType: 'xlsx',
          type: 'array'
        });

        await this.saveAsExcelFile(excelBuffer, fileName);
        resolve();
      } catch (error) {
        console.error('Error en exportExcelFromJson:', error);
        reject(
          new Error(
            `Error al exportar Excel desde JSON: ${
              error instanceof Error ? error.message : 'Error desconocido'
            }`
          )
        );
      }
    });
  }
}

interface Wscols {
  [key: string]: string;
  // Aquí van las otras propiedades de Wscols
}
