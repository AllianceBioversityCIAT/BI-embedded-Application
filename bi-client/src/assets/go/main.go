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

        // Configure CSV reader
    reader := csv.NewReader(strings.NewReader(csvStr))
    reader.LazyQuotes = true
    reader.TrimLeadingSpace = true
    reader.FieldsPerRecord = -1
    reader.Comment = '#'

    // Read all records
    records, err := reader.ReadAll()
    if err != nil {
        return nil
    }

    if len(records) == 0 {
        return nil
    }

    // Create new Excel file
    f := excelize.NewFile()
    defer f.Close()

    sheet := f.GetSheetName(0)

    // Process records
    for rowIndex, row := range records {
        if rowIndex >= 1048576 { // Excel maximum row limit
            break
        }

        for colIndex, cell := range row {
            if colIndex >= 16384 { // Excel maximum column limit
                break
            }

            // Generate cell name
            cellName, err := excelize.CoordinatesToCellName(colIndex+1, rowIndex+1)
            if err != nil {
                continue
            }

            // Clean and truncate content
            cellValue := cleanCellValue(cell)

            // Write value to cell
            err = f.SetCellValue(sheet, cellName, cellValue)
            if err != nil {
                continue
            }
        }
    }

    // Generate Excel file
    buf := new(bytes.Buffer)
    if err := f.Write(buf); err != nil {
        return nil
    }

    b := buf.Bytes()

    // Convert to Uint8Array for JavaScript
    wasmBytes := js.Global().Get("Uint8Array").New(len(b))
    js.CopyBytesToJS(wasmBytes, b)

    return wasmBytes
}

func cleanCellValue(value string) string {
    // Truncate if too long
    if len(value) > 32767 {
        return value[:32767]
    }

    // Clean problematic characters
    cleaned := strings.ReplaceAll(value, "\r\n", "\n")
    cleaned = strings.ReplaceAll(cleaned, "\r", "\n")

    return cleaned
}

func main() {
    js.Global().Set("generateExcelWasm", js.FuncOf(generateExcelWasm))

    // Keep program running
    select {}
}
