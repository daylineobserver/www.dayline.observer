const { api, UI } = require('./app');
const fixtures = require('./fixtures');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);
global.DOMPurify = DOMPurify;
global.document = window.document;

dayjs.extend(utc);
dayjs.extend(timezone);
global.dayjs = dayjs;

const API_URL = 'https://api.dayline.observer'

describe('UI.formatData', () => {
    let originalDayjs;
    let originalGuess;

    beforeEach(() => {
        originalDayjs = global.dayjs;
        originalGuess = dayjs.tz.guess;
    });

    afterEach(() => {
        global.dayjs = originalDayjs;
        dayjs.tz.guess = originalGuess;
    });

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
        delete global.dayjs;
        
        const data = {
            updated_at: "2026-01-12T10:00:53Z"
        };
        UI.formatData(data);
        // Fallback formatting: (10:00AM | Mon | 12 Jan, 2026)
        expect(data.formattedDate).toBe("(10:00AM | Mon | 12 Jan, 2026)");
    });

    test('should format updated_at using dayjs in UTC', () => {
        // Mock timezone guess
        dayjs.tz.guess = () => 'UTC';

        const data = {
            updated_at: "2026-01-12T10:00:53Z"
        };
        UI.formatData(data);
        // Expect: (10:00AM | Mon | 12 Jan, 2026) UTC
        expect(data.formattedDate).toBe("(10:00AM | Mon | 12 Jan, 2026 UTC)");
    });

    test('should format updated_at using dayjs in Asia/Hong_Kong', () => {
        // Mock timezone guess
        dayjs.tz.guess = () => 'Asia/Hong_Kong';

        const data = {
            updated_at: "2026-01-12T10:00:53Z"
        };
        UI.formatData(data);
        // 2026-01-12 10:00:53 UTC is 2026-01-12 18:00:53 HKT
        // Note: Intl.DateTimeFormat might return 'GMT+8' instead of 'HKT' depending on the environment
        expect(["(6:00PM | Mon | 12 Jan, 2026 HKT)", "(6:00PM | Mon | 12 Jan, 2026 GMT+8)"]).toContain(data.formattedDate);
    });

    test('should format updated_at using dayjs in America/New_York', () => {
        // Mock timezone guess
        dayjs.tz.guess = () => 'America/New_York';

        const data = {
            updated_at: "2026-01-12T10:00:53Z"
        };
        UI.formatData(data);
        // 2026-01-12 10:00:53 UTC is 2026-01-12 05:00:53 EST
        // Note: Intl.DateTimeFormat might return 'GMT-5' instead of 'EST' depending on the environment
        expect(["(5:00AM | Mon | 12 Jan, 2026 EST)", "(5:00AM | Mon | 12 Jan, 2026 GMT-5)"]).toContain(data.formattedDate);
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
        expect(global.fetch).toHaveBeenCalledWith(API_URL + "/weather");
        expect(data).toEqual(fixtures.weather);
    });

    test('getEDB should fetch from the correct URL', async () => {
        global.fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue(fixtures.edb)
        });

        const data = await api.getEDB();
        expect(global.fetch).toHaveBeenCalledWith(API_URL + "/edb");
        expect(data).toEqual(fixtures.edb);
    });

    test('getAirQuality should fetch from the correct URL', async () => {
        global.fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue(fixtures.airQuality)
        });

        const data = await api.getAirQuality();
        expect(global.fetch).toHaveBeenCalledWith(API_URL + "/aqi");
        expect(data).toEqual(fixtures.airQuality);
    });

    test('getNews should fetch from the correct URL', async () => {
        global.fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue(fixtures.news)
        });

        const data = await api.getNews();
        expect(global.fetch).toHaveBeenCalledWith(API_URL + "/news");
        expect(data).toEqual(fixtures.news);
    });

    test('getEveningNews should fetch from the correct URL', async () => {
        global.fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue(fixtures.newsEvening)
        });

        const data = await api.getEveningNews();
        expect(global.fetch).toHaveBeenCalledWith(API_URL + "/news1");
        expect(data).toEqual(fixtures.newsEvening);
    });
});

describe('XSS Protection', () => {
    let contentArea;
    let originalMarked;

    beforeEach(() => {
        document.body.innerHTML = '<div id="content-area"></div>';
        contentArea = document.getElementById('content-area');
        UI.contentArea = contentArea;
        originalMarked = global.marked;
    });

    afterEach(() => {
        global.marked = originalMarked;
    });

    test('renderWeather should sanitize HTML injection in title and body', () => {
        const maliciousData = {
            title: 'Weather <img src=x onerror=alert(1)>',
            body: 'Safe body <script>alert("xss")</script>',
            body1: 'Safe body 1 <iframe src="javascript:alert(1)"></iframe>',
            formattedDate: '(10:00AM)'
        };

        UI.renderWeather(maliciousData);

        const html = contentArea.innerHTML;
        expect(html).not.toContain('onerror=alert(1)');
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<iframe');
        expect(html).toContain('Weather <img src="x">');
    });

    test('renderEDB should sanitize HTML injection', () => {
        const maliciousData = {
            id: 'edb <svg onload=alert(1)>',
            body: 'Alert message <img src=x onerror=alert(1)>',
            formattedDate: '(10:00AM)'
        };

        UI.renderEDB(maliciousData);

        const html = contentArea.innerHTML;
        expect(html).not.toContain('onload=alert(1)');
        expect(html).not.toContain('onerror=alert(1)');
    });

    test('renderAirQuality should render markdown if marked is present', () => {
        global.marked = {
            parse: (text) => `<p>${text}</p>`
        };
        const data = {
            body: 'Commentary **bold**',
            body1: 'Readings *italic*',
            formattedDate: '(10:00AM)'
        };
        UI.renderAirQuality(data);
        const html = UI.contentArea.innerHTML;
        expect(html).toContain('<p>Commentary **bold**</p>');
        expect(html).toContain('<p>Readings *italic*</p>');
        expect(html).toContain('markdown-content');
    });

    test('renderWeather should render markdown if marked is present', () => {
        global.marked = {
            parse: (text) => `<div>${text}</div>`
        };
        const data = {
            title: 'Weather',
            body: 'Body markdown',
            body1: 'Summary markdown',
            formattedDate: '(10:00AM)'
        };
        UI.renderWeather(data);
        const html = UI.contentArea.innerHTML;
        expect(html).toContain('<div>Body markdown</div>');
        expect(html).toContain('<div>Summary markdown</div>');
    });

    test('renderEDB should render markdown if marked is present', () => {
        global.marked = {
            parse: (text) => `<span>${text}</span>`
        };
        const data = {
            id: 'edb',
            body: 'EDB body markdown',
            formattedDate: '(10:00AM)'
        };
        UI.renderEDB(data);
        const html = UI.contentArea.innerHTML;
        expect(html).toContain('<span>EDB body markdown</span>');
    });

    test('renderAirQuality should sanitize HTML injection', () => {
        const maliciousData = {
            body: 'Warnings <script>alert(1)</script>',
            body1: 'Readings <img src=x onerror=alert(1)>',
            formattedDate: '(10:00AM)'
        };

        UI.renderAirQuality(maliciousData);

        const html = UI.contentArea.innerHTML;
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('onerror=alert(1)');
    });

    test('markdown-content should preserve newlines when marked is absent', () => {
        // Ensure marked is NOT present
        delete global.marked;

        const data = {
            id: 'edb',
            body: "Line 1\nLine 2",
            formattedDate: '(10:00AM)'
        };
        UI.renderEDB(data);
        const html = UI.contentArea.innerHTML;
        // With the new fallback, \n should be converted to <br>
        expect(html).toContain("Line 1<br>Line 2");
    });

    test('renderNews should sanitize HTML injection after markdown parsing', () => {
        const maliciousData = {
            title: 'News <img src=x onerror=alert(1)>',
            body: 'Markdown body <a href="javascript:alert(1)">click me</a>',
            body1: 'Footer <script>alert(1)</script>',
            formattedDate: '(10:00AM)'
        };

        // Mock marked
        global.marked = {
            parse: (text) => text
        };

        UI.renderNews(maliciousData);

        const html = contentArea.innerHTML;
        expect(html).not.toContain('onerror=alert(1)');
        expect(html).not.toContain('javascript:alert(1)');
        expect(html).not.toContain('<script>');
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = fixtures;
}