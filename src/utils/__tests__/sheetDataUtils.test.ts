import { describe, test, expect } from "vitest";
import { SheetDataUtils } from "../sheetDataUtils";

describe('SheetDataUtils', () => {
    describe('findHeaderRow', () => {
        test('should handle sheet with header at row 0', () => {
            const sheetData = [
                ['Date', 'USD', 'EUR', 'GBP'],
                [44927, 1.0, 1.1, 1.3],  // Excel date serial for 2023-01-01
                [44928, 1.0, 1.2, 1.4],  // Excel date serial for 2023-01-02
                [45292, 1.0, 1.1, 1.3],  // Excel date serial for 2024-01-01
                [45293, 1.0, 1.2, 1.4]   // Excel date serial for 2024-01-02
            ];
            const result = SheetDataUtils.findHeaderRow(sheetData);
            expect(result).toBe(0);
        });

        test('should handle sheet with pre-header rows', () => {
            const sheetData = [
                ['Exchange Rates Report'],
                ['Generated on 2024-01-01'],
                ['Date', 'USD', 'EUR', 'GBP'],
                [45292, 1.0, 1.1, 1.3],
                [45293, 1.0, 1.2, 1.4]
            ];
            const result = SheetDataUtils.findHeaderRow(sheetData);
            expect(result).toBe(2);
        });

        test('should handle sheet with empty rows before header row', () => {
            const sheetData = [
                ['Exchange Rates Report'],
                ['', '', '', ''],
                [],
                [],
                ['Date', 'USD', 'EUR', 'GBP'],
                [45292, 1.0, 1.1, 1.3],
                [45293, 1.0, 1.2, 1.4]
            ];
            const result = SheetDataUtils.findHeaderRow(sheetData);
            expect(result).toBe(4);
        });
    });
});