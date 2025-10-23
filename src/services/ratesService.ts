import { Rates, RequestParams, YearRates } from '../types';
import { SheetsService } from './sheetsService';
import { CacheService } from './cacheService';
import { DateUtils } from '../utils/dateUtils';

export class RatesService {
    private DEFAULT_SPREADSHEET_ID: string | undefined;

    private sheetsService: SheetsService;
    private cacheService: CacheService;

    constructor(env?: {
        DISABLE_CACHE: string; GOOGLE_SERVICE_ACCOUNT_KEY?: string, DEFAULT_SPREADSHEET_ID?: string, RATES_CACHE?: KVNamespace
    }) {
        this.sheetsService = new SheetsService(env);
        if (env?.RATES_CACHE) {
            this.cacheService = new CacheService({ RATES_CACHE: env.RATES_CACHE, DISABLE_CACHE: env.DISABLE_CACHE });
        } else {
            throw new Error('RATES_CACHE is not set');
        }
        this.DEFAULT_SPREADSHEET_ID = env?.DEFAULT_SPREADSHEET_ID;
    }

    async processRatesRequest(params: RequestParams): Promise<Rates | string> {
        let {
            date: dateParam,
            usePreviousBusinessDay: previousBusinessDayParam,
            from: fromParam,
            to: toParam,
            tab: tabParam,
            sheetId: spreadsheetIdParam,
            clearCache: clearCacheParam
        } = params;

        if (!spreadsheetIdParam && !this.DEFAULT_SPREADSHEET_ID) {
            throw new Error('Please provide the sheetId parameter');
        }

        spreadsheetIdParam = spreadsheetIdParam || this.DEFAULT_SPREADSHEET_ID;

        if (!tabParam) {
            tabParam = "Rates";
        }

        // Handle cache clearing
        if (clearCacheParam) {
            await this.cacheService.clearSheetCache(spreadsheetIdParam!);
            const spreadsheetName = await this.sheetsService.getSpreadsheetName(spreadsheetIdParam!);
            return `Rates cache cleared for ${spreadsheetName}`;
        }

        // Validate parameters
        if (!dateParam && !fromParam) {
            throw new Error('Please provide date or from parameters');
        }

        // Single date request
        if (dateParam) {
            return await this.createRatesOutputForDate(spreadsheetIdParam!, dateParam, tabParam, previousBusinessDayParam);
        }

        // Date range request
        if (!fromParam) {
            throw new Error('Please provide from parameter');
        }

        const toParamFinal = toParam || new Date().toISOString().substring(0, 10);
        return await this.createRatesOutputForRangeOfDates(spreadsheetIdParam!, fromParam, toParamFinal, tabParam);
    }

    private async createRatesOutputForDate(spreadsheetId: string, dateParam: string, tabParam: string, previousBusinessDayParam?: string): Promise<Rates> {
        const year = parseInt(dateParam.split('-')[0]);

        // Try cached rates
        const cacheKey = this.cacheService.getCacheKey(spreadsheetId, year);
        const documentData = await this.cacheService.get(cacheKey);
        if (documentData) {
            const rates = this.findRatesForDate(documentData, dateParam, previousBusinessDayParam ? true : false);
            if (rates) {
                console.log('DEBUG: GOT FROM CACHE');
                console.log(rates);
                return rates;
            }
        }

        // Get sheet data for a year
        let values;
        try {
            values = await this.sheetsService.getSheetDataForYear(spreadsheetId, year, tabParam);
            // build rates object
            const yearRatesObject = this.buildYearRatesObject(spreadsheetId, year, values);
            const rates = this.findRatesForDate(yearRatesObject, dateParam, previousBusinessDayParam ? true : false);
            if (rates) {
                // cache the result
                console.log('DEBUG: GOT FROM SHEET');
                await this.cacheService.put(cacheKey, JSON.stringify(yearRatesObject, null, 4));
                console.log(rates);
                return rates;
            }
        } catch (error) {
            console.error('DEBUG: Error getting sheet data:', error);
            throw error;
        }

        // No rates available
        let rates: Rates = {
            base: 'USD',
            status: 400,
            rates: {},
            error: true,
            message: 'not_available',
            description: `No rates for date ${dateParam} available`
        };

        return rates;
    }

    private async createRatesOutputForRangeOfDates(spreadsheetId: string, fromParam: string, toParam: string, tabParam: string): Promise<Rates> {
        // DISABLE CACHE FOR RANGE OF DATES FOR NOW (matching original behavior)

        // Get sheet data
        const values = await this.sheetsService.getSheetData(spreadsheetId, tabParam);

        if (!values || values.length === 0) {
            const spreadsheetName = await this.sheetsService.getSpreadsheetName(spreadsheetId);
            throw new Error(`Sheet ${tabParam} not found on ${spreadsheetName}`);
        }

        // Parse date range
        const from = DateUtils.parseDate(fromParam);
        const to = DateUtils.parseDate(toParam);

        if (!from || !to) {
            throw new Error(`Invalid date format in range: ${fromParam} to ${toParam}`);
        }

        // Find range rows
        let rowIndexes: number[] = [];
        for (let i = values.length - 1; i > 0; i--) {
            const rawValue = values[i][0];
            if (!rawValue) {
                continue;
            }

            const currentDate = DateUtils.createDateFromSheetValue(rawValue);
            if (!currentDate) {
                continue;
            }

            if (currentDate >= from && currentDate <= to) {
                rowIndexes.push(i);
            }
        }

        // Order dates chronologically
        rowIndexes.reverse();

        // Initialize rates object
        let rates: Rates = { base: 'USD', status: 200, rates: {} };

        // No rates available
        if (rowIndexes.length === 0) {
            rates.error = true;
            rates.message = 'not_available';
            rates.status = 400;
            rates.description = `No rates from ${fromParam} to ${toParam} available`;
            return rates;
        }

        // Build rates for date range
        const header = values[0];

        // Set from and to dates
        const firstRow = values[rowIndexes[0]];
        const lastRow = values[rowIndexes[rowIndexes.length - 1]];
        const firstDate = DateUtils.createDateFromSheetValue(firstRow[0]);
        const lastDate = DateUtils.createDateFromSheetValue(lastRow[0]);

        if (firstDate && lastDate) {
            rates.from = DateUtils.formatDate(firstDate);
            rates.to = DateUtils.formatDate(lastDate);
        }

        // Build rates for each date
        for (const rowIndex of rowIndexes) {
            const row = values[rowIndex];
            const rowDate = DateUtils.createDateFromSheetValue(row[0]);

            if (rowDate) {
                const dateStr = DateUtils.formatDate(rowDate);
                let dateRates: { [key: string]: string } = {};

                for (let i = 1; i < row.length; i++) {
                    const cellValue = row[i];
                    if (!isNaN(cellValue) && header[i]) {
                        dateRates[header[i]] = cellValue.toString();
                    }
                }

                rates.rates[dateStr] = dateRates;
            }
        }

        return rates;
    }

    private findRatesForDate(yearRates: YearRates, dateParam: string, previousBusinessDayParam: boolean): Rates | null {
        const date = DateUtils.parseDate(dateParam);
        let foundDate: Date | undefined;
        if (!date) {
            return null;
        }

        let rowIndex = -1;
        for (let i = yearRates.rates.length - 1; i >= 0; i--) {
            const rate = yearRates.rates[i];
            const rateDateObj = rate.date;
            if (!rateDateObj) {
                continue;
            }
            const rateDate = DateUtils.parseDate(rateDateObj);
            if (rateDate && rateDate <= date) {
                rowIndex = i;
                foundDate = rateDate;
                break;
            }
        }
        if (rowIndex === -1) {
            return null;
        }
        if (previousBusinessDayParam) {
            if (rowIndex === 0) {
                return null;
            }
            if (foundDate && foundDate < date) {
                return yearRates.rates[rowIndex];
            } else {
                return yearRates.rates[rowIndex - 1];
            }
        }
        return yearRates.rates[rowIndex];
    }

    private buildYearRatesObject(spreadsheetId: string, year: number, values: any[][]): YearRates {
        const createdAt = new Date().toISOString().substring(0, 10);
        const yearRates: YearRates = { createdAt: createdAt, spreadsheetId: spreadsheetId, year: year.toString(), rates: [] };
        // get the header values (exchange codes) from spreadsheet
        const header = values[0];

        // Build rates for each date
        for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
            const row = values[rowIndex];
            const rowDate = DateUtils.createDateFromSheetValue(row[0]);

            if (rowDate) {
                let dateRates: { [key: string]: string } = {};

                for (let columnIndex = 1; columnIndex < row.length; columnIndex++) {
                    const cellValue = row[columnIndex];
                    if (cellValue !== null && cellValue !== undefined && typeof cellValue != 'string' && !isNaN(cellValue) && header[columnIndex]) {
                        dateRates[header[columnIndex]] = cellValue.toString();
                    }
                }

                const dateStr = DateUtils.formatDate(rowDate);
                const rate: Rates = { base: 'USD', status: 200, rates: dateRates, date: dateStr };
                yearRates.rates.push(rate);
            }
        }

        return yearRates;
    }
}