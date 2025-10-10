export interface Rates {
    base: string;
    date?: string;
    error?: boolean;
    message?: string;
    status: number;
    description?: string;
    // Single date - [code]: rate
    // Range of dates - [date]: { [code]: rate }
    rates: { [key: string]: string | { [key: string]: string } };
    // Used to fetch rates for a range of dates
    from?: string;
    to?: string;
}

export interface YearRates {
    createdAt: string;
    spreadsheetId: string;
    year: string;
    rates: Rates[];
}

export interface RequestParams {
    date?: string;
    from?: string;
    to?: string;
    tab?: string;
    sheetId?: string;
    clearCache?: string;
}