import { google, sheets_v4 } from 'googleapis';
import { DateUtils } from '../utils/dateUtils';
import { SheetDataUtils } from '../utils/sheetDataUtils';

export class SheetsService {
    private sheets: sheets_v4.Sheets;

    constructor(env?: { GOOGLE_SERVICE_ACCOUNT_KEY?: string }) {
        let auth;

        // Get credentials from Wrangler env (where .env variables are loaded)
        const serviceAccountKey = env?.GOOGLE_SERVICE_ACCOUNT_KEY;

        if (serviceAccountKey) {
            try {
                const credentials = JSON.parse(serviceAccountKey);
                // Use JWT auth client directly for service account
                auth = new google.auth.JWT({
                    email: credentials.client_email,
                    key: credentials.private_key,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
                });
            } catch (error) {
                console.error('Error parsing service account key:', error);
                throw new Error('Invalid service account key format');
            }
        } else {
            console.log('Falling back to keyFile authentication');
            // Fallback to keyFile for local development
            auth = new google.auth.GoogleAuth({
                keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
        }

        this.sheets = google.sheets({ version: 'v4', auth });
    }

    async getSpreadsheetName(spreadsheetId: string): Promise<string> {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId,
                fields: 'properties.title'
            });
            return response.data.properties?.title || spreadsheetId;
        } catch (error) {
            console.error('Error getting spreadsheet name:', error);
            return spreadsheetId; // Fallback to ID if name can't be retrieved
        }
    }

    async getSheetData(spreadsheetId: string, tabName: string): Promise<any[][]> {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: tabName,
                valueRenderOption: 'UNFORMATTED_VALUE'
            });

            return response.data.values || [];
        } catch (error) {
            console.error('Error getting sheet data:', error);
            throw new Error(`Failed to get sheet data: ${error}`);
        }
    }

    async getSheetDataForYear(spreadsheetId: string, yearParam: number, tabName: string): Promise<any[][]> {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: tabName,
                valueRenderOption: 'UNFORMATTED_VALUE'
            });
            const sheetValues = response.data.values || [];

            // look for the row containing the exchange codes
            const headerRowIndex = SheetDataUtils.findHeaderRow(sheetValues);
            if (headerRowIndex === -1) {
                throw new Error('No valid header row found in the rates sheet');
            }
            const header = sheetValues[headerRowIndex];

            const yearValues = sheetValues.filter(row => DateUtils.createDateFromSheetValue(row[0])?.getFullYear() === yearParam);
            yearValues.unshift(header);
            return yearValues;
        } catch (error) {
            console.error('Error getting sheet data:', error);
            throw new Error(`Failed to get sheet data: ${error}`);
        }
    }

    async verifySheetExists(spreadsheetId: string, tabName: string): Promise<boolean> {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId,
                fields: 'sheets.properties.title'
            });

            const sheets = response.data.sheets || [];
            return sheets.some(sheet => sheet.properties?.title === tabName);
        } catch (error) {
            console.error('Error verifying sheet exists:', error);
            return false;
        }
    }
}