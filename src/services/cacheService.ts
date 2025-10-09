export class CacheService {
    // private firestore: Firestore;
    // private readonly collectionName: string;

    // // Cache TTL constants (matching original GAS values)
    // public static readonly HALF_DAY_CACHE = 3600 * 12;

    // constructor() {
    //     this.firestore = new Firestore({
    //         projectId: process.env.GOOGLE_CLOUD_PROJECT,
    //         keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    //     });

    //     this.collectionName = process.env.FIRESTORE_COLLECTION || 'rates-cache';
    // }

    // getCacheKey(spreadsheetId: string, yearParam: number): string {
    //     return `${spreadsheetId}_${yearParam}`;
    // }

    // async get(key: string): Promise<FirebaseFirestore.DocumentData | null> {
    //     // Skip cache if disabled via environment variable
    //     if (process.env.DISABLE_CACHE === 'true') {
    //         console.log('DEBUG: Cache disabled, skipping get for', key);
    //         return null;
    //     }
        
    //     try {
    //         const document = await this.firestore.collection(this.collectionName).doc(key).get();
    //         if (document.data() && document.data()?.expireAt && document.data()?.expireAt.toDate() < new Date()) {
    //             console.log('DEBUG: Cache expired for ', key);
    //             await this.delete(key);
    //             console.log('DEBUG: Cache deleted for ', key);
    //             return null;
    //         }
    //         return document.data() || null;
    //     } catch (error) {
    //         console.error('Error getting cache:', error);
    //         return null;
    //     }
    // }

    // async put(key: string, value: string, ttlSeconds: number): Promise<void> {
    //     // Skip cache if disabled via environment variable
    //     if (process.env.DISABLE_CACHE === 'true') {
    //         console.log('DEBUG: Cache disabled, skipping put for', key);
    //         return;
    //     }
        
    //     try {
    //         const expireAt = new Date(Date.now() + ttlSeconds * 1000);

    //         await this.firestore.collection(this.collectionName).doc(key).set({
    //             value,
    //             expireAt,
    //             createdAt: new Date()
    //         });
    //         console.log('DEBUG: Cache set for ', key);

    //     } catch (error) {
    //         console.error('Error setting cache:', error);
    //         throw error;
    //     }
    // }

    // async delete(key: string): Promise<void> {
    //     try {
    //         await this.firestore.collection(this.collectionName).doc(key).delete();
    //     } catch (error) {
    //         console.error('Error deleting cache:', error);
    //         throw error;
    //     }
    // }

    // // Helper method to clear cache for a spreadsheet
    // async clearSheetCache(sheetId: string): Promise<void> {
    //     try {
    //         const snapshot = await this.firestore.collection(this.collectionName).get();
    //         if (snapshot.empty) {
    //             console.log('No documents found');
    //             return;
    //         }
    //         const documents = snapshot.docs.map(doc => doc.id);
    //         for (const document of documents) {
    //             if (document.includes(sheetId)) {
    //                 await this.delete(document);
    //             }
    //         }
    //         console.log('DEBUG: Cleared cache for ', sheetId);
    //     } catch (error) {
    //         console.error('Error getting documents:', error);
    //     }
    // }
}