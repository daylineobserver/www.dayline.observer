const { api, UI } = require('./app');
const fixtures = require('./fixtures');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);
global.dayjs = dayjs;

describe('UI.formatData', () => {
    test('should replace literal \\n with actual newline characters', () => {
        const data = {
            body: "Line 1\\nLine 2",
            body1: "Other 1\\nOther 2"
        };
        UI.formatData(data);
        expect(data.body).toBe("Line 1\nLine 2");
        expect(data.body1).toBe("Other 1\nOther 2");
    });

    test('should handle missing body or body1', () => {
        const data = {
            title: "Test"
        };
        UI.formatData(data);
        expect(data.title).toBe("Test");
        expect(data.body).toBeUndefined();
        expect(data.body1).toBeUndefined();
    });

    test('should format updated_at into formattedDate (fallback when dayjs is missing)', () => {
        const originalDayjs = global.dayjs;
        delete global.dayjs;
        
        const data = {
            updated_at: "2026-01-12T10:00:53Z"
        };
        UI.formatData(data);
        // Fallback formatting: (10:00AM | Mon | 12 Jan, 2026)
        expect(data.formattedDate).toBe("(10:00AM | Mon | 12 Jan, 2026)");
        
        global.dayjs = originalDayjs;
    });

    test('should format updated_at using dayjs in UTC', () => {
        // Mock timezone guess
        const originalGuess = dayjs.tz.guess;
        dayjs.tz.guess = () => 'UTC';

        const data = {
            updated_at: "2026-01-12T10:00:53Z"
        };
        UI.formatData(data);
        // Expect: (10:00AM | Mon | 12 Jan, 2026) UTC
        expect(data.formattedDate).toBe("(10:00AM | Mon | 12 Jan, 2026 UTC)");

        dayjs.tz.guess = originalGuess;
    });

    test('should format updated_at using dayjs in Asia/Hong_Kong', () => {
        // Mock timezone guess
        const originalGuess = dayjs.tz.guess;
        dayjs.tz.guess = () => 'Asia/Hong_Kong';

        const data = {
            updated_at: "2026-01-12T10:00:53Z"
        };
        UI.formatData(data);
        // 2026-01-12 10:00:53 UTC is 2026-01-12 18:00:53 HKT
        // Note: Intl.DateTimeFormat might return 'GMT+8' instead of 'HKT' depending on the environment
        expect(["(6:00PM | Mon | 12 Jan, 2026 HKT)", "(6:00PM | Mon | 12 Jan, 2026 GMT+8)"]).toContain(data.formattedDate);

        dayjs.tz.guess = originalGuess;
    });

    test('should format updated_at using dayjs in America/New_York', () => {
        // Mock timezone guess
        const originalGuess = dayjs.tz.guess;
        dayjs.tz.guess = () => 'America/New_York';

        const data = {
            updated_at: "2026-01-12T10:00:53Z"
        };
        UI.formatData(data);
        // 2026-01-12 10:00:53 UTC is 2026-01-12 05:00:53 EST
        // Note: Intl.DateTimeFormat might return 'GMT-5' instead of 'EST' depending on the environment
        expect(["(5:00AM | Mon | 12 Jan, 2026 EST)", "(5:00AM | Mon | 12 Jan, 2026 GMT-5)"]).toContain(data.formattedDate);

        dayjs.tz.guess = originalGuess;
    });
});

describe('api methods', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('getWeather should fetch from the correct URL', async () => {
        global.fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue(fixtures.weather)
        });

        const data = await api.getWeather();
        expect(global.fetch).toHaveBeenCalledWith("https://api.remindify.me/weather");
        expect(data).toEqual(fixtures.weather);
    });

    test('getEDB should fetch from the correct URL', async () => {
        global.fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue(fixtures.edb)
        });

        const data = await api.getEDB();
        expect(global.fetch).toHaveBeenCalledWith("https://api.remindify.me/edb");
        expect(data).toEqual(fixtures.edb);
    });

    test('getAirQuality should fetch from the correct URL', async () => {
        global.fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue(fixtures.airQuality)
        });

        const data = await api.getAirQuality();
        expect(global.fetch).toHaveBeenCalledWith("https://api.remindify.me/aqi");
        expect(data).toEqual(fixtures.airQuality);
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = fixtures;
}