export class SheetDataUtils {
    private static readonly COMMON_CURRENCY_CODES: string[] = [
        'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK',
        'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'CNY', 'INR', 'BRL', 'MXN', 'ZAR',
        'KRW', 'SGD', 'HKD', 'THB', 'MYR', 'PHP', 'IDR', 'VND', 'TWD', 'ILS',
        'TRY', 'AED', 'SAR', 'EGP', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP'
    ];

    static findHeaderRow(sheetData: any[][]): number {
        for (let i = 0; i < sheetData.length && i < 5; i++) {
            const row = sheetData[i];
            for (let j = 0; j < row.length; j++) {
                const cell = row[j];
                if (typeof cell !== 'string') {
                    continue;
                } else {
                    for (const currencyCode of this.COMMON_CURRENCY_CODES) {
                        if (cell.toUpperCase().includes(currencyCode)) {
                            // check if there is at least one cell in the same column containing a number (rate value)
                            for (let k = i + 1; k < sheetData.length; k++) {
                                const cell = sheetData[k][j];
                                if (typeof cell !== 'number') {
                                    continue;
                                } else {
                                    return i;
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
        return -1;
    }
}