import { describe, test, expect } from "vitest";
import { SheetDataUtils } from "../sheetDataUtils";

describe('SheetDataUtils', () => {
    describe('findHeaderRow', () => {
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
    });
});