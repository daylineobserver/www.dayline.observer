const { api, UI } = require('./app');
const fixtures = require('./fixtures');

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

    test('should format updated_at into formattedDate', () => {
        const data = {
            updated_at: "2026-01-12T10:00:53Z"
        };
        UI.formatData(data);
        // 10:00 UTC
        expect(data.formattedDate).toBe("(10:00AM | Mon | 12 Jan, 2026)");
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