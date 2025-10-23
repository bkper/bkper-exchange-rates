import { describe, test, expect, vi, beforeEach } from 'vitest';
import { RatesService } from '../ratesService';
import { SheetsService } from '../sheetsService';
import { CacheService } from '../cacheService';
import { YearRates } from '../../types';

// Mock the dependencies
vi.mock('../sheetsService');
vi.mock('../cacheService');

describe('RatesService', () => {
    let ratesService: RatesService;
    let mockSheetsService: SheetsService;
    let mockCacheService: CacheService;
    let mockRatesCache: KVNamespace;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Create mock KV namespace
        mockRatesCache = {
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            list: vi.fn()
        } as any;

        // Create mock environment
        const mockEnv = {
            GOOGLE_SERVICE_ACCOUNT_KEY: JSON.stringify({
                client_email: 'test@test.com',
                private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n'
            }),
            DEFAULT_SPREADSHEET_ID: 'test-spreadsheet-id',
            RATES_CACHE: mockRatesCache,
            DISABLE_CACHE: 'true'
        };

        // Create service instance
        ratesService = new RatesService(mockEnv);

        // Get mock instances
        mockSheetsService = vi.mocked(ratesService['sheetsService']);
        mockCacheService = vi.mocked(ratesService['cacheService']);
    });

    describe('findRatesForDate', () => {
        const yearRatesObject: YearRates = {
            createdAt: '2023-12-31',
            spreadsheetId: 'test-id',
            year: '2023',
            rates: [
                {
                    base: 'USD',
                    status: 200,
                    date: '2023-01-15',
                    rates: { 'USD': '1', 'EUR': '1.08', 'GBP': '1.24', 'JPY': '0.0076' }
                },
                {
                    base: 'USD',
                    status: 200,
                    date: '2023-03-10',
                    rates: { 'USD': '1', 'EUR': '1.06', 'GBP': '1.21', 'JPY': '0.0074' }
                },
                {
                    base: 'USD',
                    status: 200,
                    date: '2023-05-22',
                    rates: { 'USD': '1', 'EUR': '1.09', 'GBP': '1.25', 'JPY': '0.0072' }
                },
                {
                    base: 'USD',
                    status: 200,
                    date: '2023-08-25',
                    rates: { 'USD': '1', 'EUR': '1.1', 'GBP': '1.3', 'JPY': '0.0068' }
                },
                {
                    base: 'USD',
                    status: 200,
                    date: '2023-10-18',
                    rates: { 'USD': '1', 'EUR': '1.05', 'GBP': '1.22', 'JPY': '0.0067' }
                },
                {
                    base: 'USD',
                    status: 200,
                    date: '2023-12-15',
                    rates: { 'USD': '1', 'EUR': '1.11', 'GBP': '1.27', 'JPY': '0.0071' }
                }
            ]
        };

        test('should find rates for dateParam date', () => {
            const dateParam = '2023-05-22';
            const result = (ratesService as any).findRatesForDate(yearRatesObject, dateParam);
            expect(result).toMatchObject({
                base: 'USD',
                status: 200,
                date: '2023-05-22',
                rates: { 'USD': '1', 'EUR': '1.09', 'GBP': '1.25', 'JPY': '0.0072' }
            });
        });

        test('should find the first previous business day rates before dateParam date if previousBusinessDayParam is true', () => {
            const dateParam = '2023-05-22';
            const previousBusinessDayParam = 'true';
            const result = (ratesService as any).findRatesForDate(yearRatesObject, dateParam, previousBusinessDayParam);
            expect(result).toMatchObject({
                base: 'USD',
                status: 200,
                date: '2023-03-10',
                rates: { 'USD': '1', 'EUR': '1.06', 'GBP': '1.21', 'JPY': '0.0074' }
            });
        });
    });

    describe('buildYearRatesObject', () => {
        test('should build year rates object for specific year', () => {
            const sheetData = [
                ['Date', 'USD', 'EUR', 'GBP'],
                [44927, 1.0, 1.1, 1.3],  // Excel date serial for 2023-01-01
                [44928, 1.0, 1.2, 1.4],  // Excel date serial for 2023-01-02
                [45292, 1.0, 1.1, 1.3],  // Excel date serial for 2024-01-01
                [45293, 1.0, 1.2, 1.4]   // Excel date serial for 2024-01-02
            ];

            const result = (ratesService as any).buildYearRatesObject('test-id', 2024, sheetData);

            expect(result).toMatchObject({
                spreadsheetId: 'test-id',
                year: '2024',
                rates: expect.arrayContaining([
                    expect.objectContaining({
                        base: 'USD',
                        status: 200,
                        date: '2024-01-01',
                        rates: {
                            'USD': '1',
                            'EUR': '1.1',
                            'GBP': '1.3'
                        }
                    }),
                    expect.objectContaining({
                        base: 'USD',
                        status: 200,
                        date: '2024-01-02',
                        rates: {
                            'USD': '1',
                            'EUR': '1.2',
                            'GBP': '1.4'
                        }
                    })
                ])
            });
        });
    });

    test('should handle empty or null values in data rows', () => {
        const sheetData = [
            ['Date', 'USD', 'EUR', 'GBP'],
            [45292, 1.0, null, 1.3],
            [45293, 1.0, '', 1.4],
            [45294, 1.0, 1.5, 'invalid']
        ];
    
        const result = (ratesService as any).buildYearRatesObject('test-id', 2024, sheetData);
    
        expect(result.rates[0].rates).toEqual({
            'USD': '1',
            'GBP': '1.3'
        });
        expect(result.rates[1].rates).toEqual({
            'USD': '1',
            'GBP': '1.4'
        });
        expect(result.rates[2].rates).toEqual({
            'USD': '1',
            'EUR': '1.5'
        });
    });
});
