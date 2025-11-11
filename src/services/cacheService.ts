import { DateUtils } from "../utils/dateUtils";
import { YearRates } from "../types";

export class CacheService {
    // Cache TTL constant (originally set to 1 day)
    public static readonly TTL_SECONDS = 3600 * 24;

    constructor(private env: { RATES_CACHE: KVNamespace, DISABLE_CACHE: string }) {
    }

    getCacheKey(spreadsheetId: string, yearParam: number): string {
        return `${spreadsheetId}_${yearParam}`;
    }

    async put(key: string, value: string): Promise<void> {
        // Skip cache if disabled via environment variable
        if (this.env.DISABLE_CACHE === 'true') {
            console.log('DEBUG: Cache disabled, skipping put for', key);
            return;
        }

        try {
            await this.env.RATES_CACHE.put(key, value, { expirationTtl: CacheService.TTL_SECONDS * 1000 });
            console.log('DEBUG: Cache set for ', key);
        } catch (error) {
            console.error('Error setting cache:', error);
            throw error;
        }
    }

    async get(key: string): Promise<YearRates | null> {
        // Skip cache if disabled via environment variable
        if (this.env.DISABLE_CACHE === 'true') {
            console.log('DEBUG: Cache disabled, skipping get for', key);
            return null;
        }

        try {
            const document = await this.env.RATES_CACHE.get(key);
            const documentData = document ? JSON.parse(document) as YearRates : null;
            if (documentData) {
                const createdAt = DateUtils.parseDate(documentData.createdAt);
                if (!createdAt) {
                    return null;
                }
                const expiredAt = createdAt.getTime() + CacheService.TTL_SECONDS * 1000;
                if (expiredAt < new Date().getTime()) {
                    console.log('DEBUG: Cache expired for ', key);
                    await this.delete(key);
                    return null;
                }
            }
            return documentData;
        } catch (error) {
            console.error('Error getting cache:', error);
            return null;
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.env.RATES_CACHE.delete(key);
            console.log('DEBUG: Cache deleted for ', key);
        } catch (error) {
            console.error('Error deleting cache:', error);
            throw error;
        }
    }

    // // Helper method to clear cache for a spreadsheet
    async clearSheetCache(sheetId: string): Promise<void> {
        try {
            const snapshot = await this.env.RATES_CACHE.list();
            if (snapshot.keys.length === 0) {
                console.log('No documents found');
                return;
            } else {
                for (const key of snapshot.keys) {
                    if (key.name?.includes(sheetId)) {
                        await this.delete(key.name);
                    }
                }
            }
            console.log('DEBUG: Cleared cache for ', sheetId);
        } catch (error) {
            console.error('Error getting documents:', error);
        }
    }
}