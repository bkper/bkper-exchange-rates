import { google, sheets_v4 } from 'googleapis';
import { DateUtils } from '../utils/dateUtils';

export class SheetsService {
    private sheets: sheets_v4.Sheets;

    constructor() {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

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

    async getSheetData_OLD(spreadsheetId: string, tabName: string): Promise<any[][]> {
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
            const header = sheetValues[0];
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