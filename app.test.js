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
global.window = window;

if (!global.localStorage) {
    const localStorageMock = (function() {
        let store = {};
        return {
            getItem: jest.fn(key => store[key] || null),
            setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
            clear: jest.fn(() => { store = {}; }),
            removeItem: jest.fn(key => { delete store[key]; })
        };
    })();
    Object.defineProperty(global, 'localStorage', { value: localStorageMock, configurable: true });
}

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

    test('getWeather should fetch from the correct URL with TC suffix', async () => {
        global.localStorage.setItem('language', 'tc');
        UI.translations = { tc: { errorLoading: 'Error' } };
        global.fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue(fixtures.weather)
        });

        const data = await api.getWeather();
        expect(global.fetch).toHaveBeenCalledWith(API_URL + "/weathertc");
        expect(data).toEqual(fixtures.weather);
        global.localStorage.removeItem('language');
    });

    test('getWeather should fetch from the correct URL in English', async () => {
        global.localStorage.setItem('language', 'en');
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

        // Pre-initialize translations to avoid fetch errors
        UI.translations = {
            en: { tagline: "Get updates that fit your day.", news: "News", weather: "Weather", school: "School", airQuality: "Air Quality", darkMode: "Dark Mode", lightMode: "Light Mode", switchToDarkMode: "Switch to Dark Mode", switchToLightMode: "Switch to Light Mode", contactUs: "Contact Us", rights: "Dayline Observer. All rights reserved. by", morning: "Morning", evening: "Evening", morningUpdate: "This news digest updates daily at around 7:00 - 8:00 AM.", eveningUpdate: "This news digest updates daily at around 7:00 - 8:00 PM.", errorLoading: "Error loading data.", weatherTitle: "Weather", summaryTitle: "Summary", stationReadings: "Station Readings", commentary: "Commentary", alert: "Alert", language: "Language", minRead: "min read" },
            tc: { tagline: "獲取適合您一天的更新。", news: "新聞", weather: "天氣", school: "復課安排", airQuality: "空氣質素", darkMode: "深色模式", lightMode: "淺色模式", switchToDarkMode: "切換至深色模式", switchToLightMode: "切換至淺色模式", contactUs: "聯絡我們", rights: "Dayline Observer。保留所有權利。由", morning: "早報", evening: "晚報", morningUpdate: "新聞摘要每天在上午 7:00 - 8:00 左右更新。", eveningUpdate: "新聞摘要每天在下午 7:00 - 8:00 左右更新。", errorLoading: "載入數據時出錯。", weatherTitle: "天氣", summaryTitle: "摘要", stationReadings: "站點讀數", commentary: "簡評", alert: "警告", language: "語言", minRead: "分鐘閱讀" }
        };
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

describe('UI.renderNews Reading Time', () => {
    let contentArea;

    beforeEach(() => {
        document.body.innerHTML = '<div id="content-area"></div>';
        contentArea = document.getElementById('content-area');
        UI.contentArea = contentArea;
        // Pre-initialize translations to avoid fetch errors
        UI.translations = {
            en: { tagline: "Get updates that fit your day.", news: "News", weather: "Weather", school: "School", airQuality: "Air Quality", darkMode: "Dark Mode", lightMode: "Light Mode", switchToDarkMode: "Switch to Dark Mode", switchToLightMode: "Switch to Light Mode", contactUs: "Contact Us", rights: "Dayline Observer. All rights reserved. by", morning: "Morning", evening: "Evening", morningUpdate: "This news digest updates daily at around 7:00 - 8:00 AM.", eveningUpdate: "This news digest updates daily at around 7:00 - 8:00 PM.", errorLoading: "Error loading data.", weatherTitle: "Weather", summaryTitle: "Summary", stationReadings: "Station Readings", commentary: "Commentary", alert: "Alert", language: "Language", minRead: "min read" },
            tc: { tagline: "獲取適合您一天的更新。", news: "新聞", weather: "天氣", school: "復課安排", airQuality: "空氣質素", darkMode: "深色模式", lightMode: "淺色模式", switchToDarkMode: "切換至深色模式", switchToLightMode: "切換至淺色模式", contactUs: "聯絡我們", rights: "Dayline Observer。保留所有權利。由", morning: "早報", evening: "晚報", morningUpdate: "新聞摘要每天在上午 7:00 - 8:00 左右更新。", eveningUpdate: "新聞摘要每天在下午 7:00 - 8:00 左右更新。", errorLoading: "載入數據時出錯。", weatherTitle: "天氣", summaryTitle: "摘要", stationReadings: "站點讀數", commentary: "簡評", alert: "警告", language: "語言", minRead: "分鐘閱讀" }
        };
    });

    test('should calculate and display correct reading time for long articles', () => {
        const newsData = {
            title: 'Long News',
            // 450 words = 2 mins at 225 wpm
            body: 'word '.repeat(450),
            formattedDate: '(10:00AM)'
        };

        UI.renderNews(newsData);

        const h2 = contentArea.querySelector('h2');
        expect(h2.textContent).toContain('2 min read');
    });

    test('should display 1 min read for short articles', () => {
        const newsData = {
            title: 'Short News',
            body: 'Short content',
            formattedDate: '(10:00AM)'
        };

        UI.renderNews(newsData);

        const h2 = contentArea.querySelector('h2');
        expect(h2.textContent).toContain('1 min read');
    });

    test('should apply correct styling and responsive classes', () => {
        const newsData = {
            title: 'Styled News',
            body: 'Some content',
            formattedDate: '(10:00AM)'
        };

        UI.renderNews(newsData);

        const h2 = contentArea.querySelector('h2');
        const readingTimeSpan = contentArea.querySelector('h2 span.text-gray-600.text-base.font-normal');

        expect(readingTimeSpan).toBeTruthy();
        expect(readingTimeSpan.classList.contains('text-gray-600')).toBe(true);
        expect(readingTimeSpan.classList.contains('text-base')).toBe(true);
        expect(readingTimeSpan.classList.contains('font-normal')).toBe(true);
        
        // Responsive classes
        expect(readingTimeSpan.classList.contains('block')).toBe(true);
        expect(readingTimeSpan.classList.contains('md:inline-block')).toBe(true);

        // Dot separator visibility
        const dotSpan = readingTimeSpan.querySelector('span.hidden.md\\:inline');
        expect(dotSpan).toBeTruthy();
        expect(dotSpan.classList.contains('hidden')).toBe(true);
        expect(dotSpan.classList.contains('md:inline')).toBe(true);
        expect(dotSpan.textContent).toContain('·');
    });

    test('should not display reading time if body is missing', () => {
        const newsData = {
            title: 'No Body News',
            formattedDate: '(10:00AM)'
        };

        UI.renderNews(newsData);

        const h2 = contentArea.querySelector('h2');
        expect(h2.textContent).not.toContain('min read');
    });
});

describe('UI.renderNews Update Frequency Message', () => {
    let contentArea;
    let originalParseMarkdown;

    beforeEach(() => {
        // Save the original implementation so we can restore it after each test
        originalParseMarkdown = UI.parseMarkdown;

        document.body.innerHTML = '<div id="content-area"></div>';
        contentArea = document.getElementById('content-area');
        UI.contentArea = contentArea;

        // Pre-initialize translations to avoid fetch errors
        UI.translations = {
            en: { tagline: "Get updates that fit your day.", news: "News", weather: "Weather", school: "School", airQuality: "Air Quality", darkMode: "Dark Mode", lightMode: "Light Mode", switchToDarkMode: "Switch to Dark Mode", switchToLightMode: "Switch to Light Mode", contactUs: "Contact Us", rights: "Dayline Observer. All rights reserved. by", morning: "Morning", evening: "Evening", morningUpdate: "This news digest updates daily at around 7:00 - 8:00 AM.", eveningUpdate: "This news digest updates daily at around 7:00 - 8:00 PM.", errorLoading: "Error loading data.", weatherTitle: "Weather", summaryTitle: "Summary", stationReadings: "Station Readings", commentary: "Commentary", alert: "Alert", language: "Language", minRead: "min read" },
            tc: { tagline: "獲取適合您一天的更新。", news: "新聞", weather: "天氣", school: "復課安排", airQuality: "空氣質素", darkMode: "深色模式", lightMode: "淺色模式", switchToDarkMode: "切換至深色模式", switchToLightMode: "切換至淺色模式", contactUs: "聯絡我們", rights: "Dayline Observer。保留所有權利。由", morning: "早報", evening: "晚報", morningUpdate: "新聞摘要每天在上午 7:00 - 8:00 左右更新。", eveningUpdate: "新聞摘要每天在下午 7:00 - 8:00 左右更新。", errorLoading: "載入數據時出錯。", weatherTitle: "天氣", summaryTitle: "摘要", stationReadings: "站點讀數", commentary: "簡評", alert: "警告", language: "語言", minRead: "分鐘閱讀" }
        };

        // Mock parseMarkdown for tests in this suite
        UI.parseMarkdown = (text) => text;
    });

    afterEach(() => {
        // Restore the original parseMarkdown implementation to avoid test leakage
        UI.parseMarkdown = originalParseMarkdown;
    });
    test('should display morning update message on morning news page', () => {
        const newsData = {
            title: 'Morning News',
            body: 'Some content',
            formattedDate: '(10:00AM)'
        };

        UI.renderNews(newsData, 'morning');

        const message = contentArea.querySelector('.text-gray-500.text-sm.italic');
        expect(message).toBeTruthy();
        expect(message.textContent.trim()).toBe('This news digest updates daily at around 7:00 - 8:00 AM.');
    });

    test('should display evening update message on evening news page', () => {
        const newsData = {
            title: 'Evening News',
            body: 'Some content',
            formattedDate: '(10:00AM)'
        };

        UI.renderNews(newsData, 'evening');

        const message = contentArea.querySelector('.text-gray-500.text-sm.italic');
        expect(message).toBeTruthy();
        expect(message.textContent.trim()).toBe('This news digest updates daily at around 7:00 - 8:00 PM.');
    });

    test('message should be located below the title', () => {
        const newsData = {
            title: 'Morning News',
            body: 'Some content',
            formattedDate: '(10:00AM)'
        };

        UI.renderNews(newsData, 'morning');

        const panel = contentArea.querySelector('#news-panel');
        const children = Array.from(panel.children);
        const h2Index = children.findIndex(child => child.tagName === 'H2');
        const messageElement = Array.from(contentArea.querySelectorAll('.text-gray-500.text-sm.italic'))
            .find(el => el.textContent.includes('This news digest updates daily'));
        
        expect(messageElement).toBeTruthy();
        const messageIndex = children.indexOf(messageElement);
        
        expect(h2Index).toBeGreaterThan(-1);
        expect(messageIndex).toBe(h2Index + 1);
    });
});

describe('Analytics Tracking', () => {
    let originalGtag;

    beforeEach(() => {
        // Clear require cache for app.js to ensure UI object is fresh
        delete require.cache[require.resolve('./app')];
        const { UI: freshUI } = require('./app');
        // We need to use the freshUI instead of the one imported at the top
        // But app.test.js uses UI globally.
        Object.assign(UI, freshUI);

        // Pre-initialize translations to avoid fetch errors
        UI.translations = {
            en: { tagline: "Get updates that fit your day.", news: "News", weather: "Weather", school: "School", airQuality: "Air Quality", darkMode: "Dark Mode", lightMode: "Light Mode", switchToDarkMode: "Switch to Dark Mode", switchToLightMode: "Switch to Light Mode", contactUs: "Contact Us", rights: "Dayline Observer. All rights reserved. by", morning: "Morning", evening: "Evening", morningUpdate: "This news digest updates daily at around 7:00 - 8:00 AM.", eveningUpdate: "This news digest updates daily at around 7:00 - 8:00 PM.", errorLoading: "Error loading data.", weatherTitle: "Weather", summaryTitle: "Summary", stationReadings: "Station Readings", commentary: "Commentary", alert: "Alert", language: "Language", minRead: "min read" },
            tc: { tagline: "獲取適合您一天的更新。", news: "新聞", weather: "天氣", school: "復課安排", airQuality: "空氣質素", darkMode: "深色模式", lightMode: "淺色模式", switchToDarkMode: "切換至深色模式", switchToLightMode: "切換至淺色模式", contactUs: "聯絡我們", rights: "Dayline Observer。保留所有權利。由", morning: "早報", evening: "晚報", morningUpdate: "新聞摘要每天在上午 7:00 - 8:00 左右更新。", eveningUpdate: "新聞摘要每天在下午 7:00 - 8:00 左右更新。", errorLoading: "載入數據時出錯。", weatherTitle: "天氣", summaryTitle: "摘要", stationReadings: "站點讀數", commentary: "簡評", alert: "警告", language: "語言", minRead: "分鐘閱讀" }
        };

        originalGtag = global.gtag;
        global.gtag = jest.fn();
        
        // Setup minimal DOM for UI.init
        document.body.innerHTML = `
            <div id="content-area"></div>
            <button id="tab-news" class="tab-btn">News</button>
            <button id="tab-weather" class="tab-btn">Weather</button>
            <div class="mobile-menu hidden"></div>
            <button id="mobile-menu-button" aria-expanded="false"></button>
        `;
        
        // Reset localStorage mocks
        global.localStorage.getItem.mockClear();
        global.localStorage.setItem.mockClear();
        
        // Reset UI properties
        UI.contentArea = null;
        UI.tabs = [];

        // Mock api calls to prevent real network requests or errors during UI.init -> switchTab
        global.fetch = jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue({})
        });
    });

    afterEach(() => {
        global.gtag = originalGtag;
        jest.restoreAllMocks();
    });

    test('UI.init should trigger page_view event exactly once', async () => {
        // Mock global.window for page_location and page_path
        global.window = {
            location: {
                href: 'http://localhost/',
                pathname: '/'
            }
        };
        
        // Ensure gtag is available when UI.init is called
        global.gtag = jest.fn();

        await UI.init();
        
        expect(global.gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({
            page_title: document.title,
            page_location: 'http://localhost/',
            page_path: '/'
        }));
        
        const pageViewCalls = global.gtag.mock.calls.filter(call => call[1] === 'page_view');
        expect(pageViewCalls.length).toBe(1);
    });

    test('UI.init should NOT trigger tab_click event (programmatic initial load)', () => {
        UI.init();
        
        const tabClickCalls = global.gtag.mock.calls.filter(call => call[1] === 'tab_click');
        expect(tabClickCalls.length).toBe(0);
    });

    test('UI.switchTab should trigger tab_click when isUserInitiated is true', async () => {
        UI.contentArea = document.getElementById('content-area');
        await UI.switchTab('weather', true);
        
        expect(global.gtag).toHaveBeenCalledWith('event', 'tab_click', {
            tab_id: 'weather'
        });
    });

    test('UI.switchTab should NOT trigger tab_click when isUserInitiated is false', async () => {
        UI.contentArea = document.getElementById('content-area');
        await UI.switchTab('weather', false);
        
        const tabClickCalls = global.gtag.mock.calls.filter(call => call[1] === 'tab_click');
        expect(tabClickCalls.length).toBe(0);
    });

    test('UI.switchTab should NOT throw error if gtag is missing', async () => {
        delete global.gtag;
        UI.contentArea = document.getElementById('content-area');
        
        // Should not throw
        await expect(UI.switchTab('weather', true)).resolves.not.toThrow();
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = fixtures;
}