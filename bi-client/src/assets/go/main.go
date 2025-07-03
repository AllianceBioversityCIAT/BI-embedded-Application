package main

import (
    "bytes"
    "encoding/csv"
    "strings"
    "syscall/js"

    "github.com/xuri/excelize/v2"
)

func generateExcelWasm(this js.Value, args []js.Value) interface{} {
    if len(args) == 0 {
        return nil
    }

    csvStr := args[0].String()
    if csvStr == "" {
        return nil
    }

    // Configurar el reader CSV
    reader := csv.NewReader(strings.NewReader(csvStr))
    reader.LazyQuotes = true
    reader.TrimLeadingSpace = true
    reader.FieldsPerRecord = -1
    reader.Comment = '#'

    // Leer todos los registros
    records, err := reader.ReadAll()
    if err != nil {
        return nil
    }

    if len(records) == 0 {
        return nil
    }

    // Crear nuevo archivo Excel
    f := excelize.NewFile()
    defer f.Close()

    sheet := f.GetSheetName(0)

    // Procesar registros
    for rowIndex, row := range records {
        if rowIndex >= 1048576 { // Límite máximo de filas en Excel
            break
        }

        for colIndex, cell := range row {
            if colIndex >= 16384 { // Límite máximo de columnas en Excel
                break
            }

            // Generar nombre de celda
            cellName, err := excelize.CoordinatesToCellName(colIndex+1, rowIndex+1)
            if err != nil {
                continue
            }

            // Limpiar y truncar contenido
            cellValue := cleanCellValue(cell)

            // Escribir valor a la celda
            err = f.SetCellValue(sheet, cellName, cellValue)
            if err != nil {
                continue
            }
        }
    }

    // Generar archivo Excel
    buf := new(bytes.Buffer)
    if err := f.Write(buf); err != nil {
        return nil
    }

    b := buf.Bytes()

    // Convertir a Uint8Array para JavaScript
    wasmBytes := js.Global().Get("Uint8Array").New(len(b))
    js.CopyBytesToJS(wasmBytes, b)

    return wasmBytes
}

func cleanCellValue(value string) string {
    // Truncar si es demasiado largo
    if len(value) > 32767 {
        return value[:32767]
    }

    // Limpiar caracteres problemáticos
    cleaned := strings.ReplaceAll(value, "\r\n", "\n")
    cleaned = strings.ReplaceAll(cleaned, "\r", "\n")

    return cleaned
}

func main() {
    js.Global().Set("generateExcelWasm", js.FuncOf(generateExcelWasm))

    // Mantener el programa corriendo
    select {}
}
