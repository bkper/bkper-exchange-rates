export class DateUtils {
    /**
     * Format a date to YYYY-MM-DD string format
     * Replaces Utilities.formatDate() from Google Apps Script
     */
    static formatDate(date: Date): string {
        return date.toISOString().substring(0, 10);
    }

    /**
     * Parse date string in YYYY-MM-DD format to Date object
     * Replaces the manual date parsing from original code
     */
    static parseDate(dateString: string): Date | null {
        let splittedDate = dateString.split('-');
        if (splittedDate.length !== 3) {
            splittedDate = dateString.split('/');
            if (splittedDate.length !== 3) {
                return null;
            }
        }

        const year = parseInt(splittedDate[0], 10);
        const month = parseInt(splittedDate[1], 10) - 1; // Month is 0-indexed in JavaScript
        const day = parseInt(splittedDate[2], 10);

        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return null;
        }

        return new Date(year, month, day);
    }

    /**
     * Create a Date object from Excel/Sheets date value
     * Handles Excel serial numbers, Date objects, and date strings
     */
    static createDateFromSheetValue(value: any): Date | null {
        if (!value) {
            return null;
        }

        // Handle Date objects
        if (value instanceof Date) {
            return new Date(value.getFullYear(), value.getMonth(), value.getDate());
        }

        // Handle Excel serial numbers (numeric values)
        if (typeof value === 'number') {
            return this.convertExcelSerialToDate(value);
        }

        // Handle string values
        if (typeof value === 'string') {
            const parsed = this.parseDate(value);
            if (parsed) {
                return parsed;
            }
        }

        return null;
    }

    /**
     * Convert Excel serial number to Date object
     * Excel uses January 1, 1900 as day 1 (with leap year bug adjustment)
     */
    private static convertExcelSerialToDate(serial: number): Date | null {
        if (serial < 1 || serial > 2958465) { // Valid Excel date range
            return null;
        }

        // Excel epoch: January 1, 1900 (day 1)
        // Note: Excel incorrectly treats 1900 as a leap year, so we need to account for this
        const excelEpoch = new Date(1900, 0, 1);
        
        // Convert serial number to milliseconds and add to epoch
        // Subtract 2 because Excel day 1 = January 1, 1900
        const milliseconds = (serial - 2) * 24 * 60 * 60 * 1000;
        const date = new Date(excelEpoch.getTime() + milliseconds);

        // Return date with time set to midnight
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
}