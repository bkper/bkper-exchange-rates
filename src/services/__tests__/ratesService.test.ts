import { describe, test, expect, vi, beforeEach } from 'vitest';
import { RatesService } from '../ratesService';
import { SheetsService } from '../sheetsService';
import { CacheService } from '../cacheService';

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

});