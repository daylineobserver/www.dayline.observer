const URL = "https://api.dayline.observer"

const getLangSuffix = () => {
    const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';
    return lang === 'tc' ? 'tc' : '';
};

const api = {
    getWeather: async () => {
        const res = await fetch(URL + "/weather" + getLangSuffix())
        return res.json()
    },
    getEDB: async () => {
        const res = await fetch(URL + "/edb" + getLangSuffix())
        return res.json()
    },
    getAirQuality: async () => {
        const res = await fetch(URL + "/aqi" + getLangSuffix())
        return res.json()
    },
    getNews: async () => {
        const res = await fetch(URL + "/news" + getLangSuffix())
        return res.json()
    },
    getEveningNews: async () => {
        const res = await fetch(URL + "/news1" + getLangSuffix())
        return res.json()
    }
};

// UI Controller
const UI = {
    contentArea: typeof document !== 'undefined' ? document.getElementById('content-area') : null,
    tabs: typeof document !== 'undefined' ? document.querySelectorAll('.tab-btn') : [],
    translations: null,

    init: async function() {
        if (!this.contentArea) this.contentArea = document.getElementById('content-area');
        if (this.tabs.length === 0) this.tabs = document.querySelectorAll('.tab-btn');

        // Fetch translations
        try {
            const response = await fetch('resources/localization.json');
            this.translations = await response.json();
        } catch (error) {
            console.error('Failed to load translations:', error);
            // Fallback translations if fetch fails
            this.translations = {
                en: { tagline: "Get updates that fit your day.", news: "News", weather: "Weather", school: "School", airQuality: "Air Quality", darkMode: "Dark Mode", lightMode: "Light Mode", switchToNightMode: "Switch to Dark Mode", switchToDayMode: "Switch to Light Mode", contactUs: "Contact Us", rights: "Dayline Observer. All rights reserved. by", morning: "Morning", evening: "Evening", morningUpdate: "This news digest updates daily at around 7:00 - 8:00 AM.", eveningUpdate: "This news digest updates daily at around 7:00 - 8:00 PM.", errorLoading: "Error loading data.", weatherTitle: "Weather", summaryTitle: "Summary", stationReadings: "Station Readings", commentary: "Commentary", alert: "Alert", language: "Language", minRead: "min read" },
                tc: { tagline: "獲取適合您一天的更新。", news: "新聞", weather: "天氣", school: "復課安排", airQuality: "空氣質素", darkMode: "深色模式", lightMode: "淺色模式", switchToNightMode: "切換至深色模式", switchToDayMode: "切換至淺色模式", contactUs: "聯絡我們", rights: "Dayline Observer。保留所有權利。由", morning: "早報", evening: "晚報", morningUpdate: "新聞摘要每天在上午 7:00 - 8:00 左右更新。", eveningUpdate: "新聞摘要每天在下午 7:00 - 8:00 左右更新。", errorLoading: "載入數據時出錯。", weatherTitle: "天氣", summaryTitle: "摘要", stationReadings: "站點讀數", commentary: "簡評", alert: "警告", language: "語言", minRead: "分鐘閱讀" }
            };
        }

        // Dark mode initialization
        this.initDarkMode();
        // Language initialization
        this.initLanguage();

        if (typeof gtag === 'function') {
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: window.location.pathname
            });
        }

        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.id.replace('tab-', '').replace('mobile-', '');
                if (tabId === 'news') {
                    const newsTabId = this.getDefaultNewsTab();
                    localStorage.setItem('activeTab', newsTabId);
                    this.switchTab(newsTabId, true);
                } else {
                    localStorage.setItem('activeTab', tabId);
                    this.switchTab(tabId, true);
                }
                
                this.closeMobileMenu();
            });
        });

        // Logo click navigation
        const logoLinks = document.querySelectorAll('.logo-link');
        logoLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const newsTabId = this.getDefaultNewsTab();
                localStorage.setItem('activeTab', newsTabId);
                this.switchTab(newsTabId, true);
                this.closeMobileMenu();
            });
        });

        // Mobile menu toggle
        const menuBtn = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');

        if (menuBtn && mobileMenu) {
            // Initialize aria-expanded based on initial menu visibility
            const isMenuHidden = mobileMenu.classList.contains('hidden');
            menuBtn.setAttribute('aria-expanded', (!isMenuHidden).toString());

            menuBtn.addEventListener('click', () => {
                const isHiddenAfterToggle = mobileMenu.classList.toggle('hidden');
                // aria-expanded is "true" when the menu is visible (not hidden)
                menuBtn.setAttribute('aria-expanded', (!isHiddenAfterToggle).toString());
            });
        }

        // Desktop dark mode hamburger menu toggle
        const desktopMenuBtn = document.getElementById('desktop-dark-mode-button');
        const desktopMenu = document.getElementById('desktop-dark-mode-menu');
        
        if (desktopMenuBtn && desktopMenu) {
            desktopMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = desktopMenu.classList.toggle('hidden');
                desktopMenuBtn.setAttribute('aria-expanded', (!isHidden).toString());
            });

            document.addEventListener('click', (e) => {
                if (!desktopMenu.classList.contains('hidden') && !desktopMenu.contains(e.target) && e.target !== desktopMenuBtn) {
                    desktopMenu.classList.add('hidden');
                    desktopMenuBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }

        // Dark mode toggles
        const desktopToggle = document.getElementById('desktop-toggle-dark');
        const mobileToggle = document.getElementById('mobile-toggle-dark');

        if (desktopToggle) {
            desktopToggle.addEventListener('click', () => {
                this.toggleDarkMode();
                if (desktopMenu && desktopMenuBtn) {
                    desktopMenu.classList.add('hidden');
                    desktopMenuBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }

        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                this.toggleDarkMode();
                this.closeMobileMenu();
            });
        }

        // Language toggles
        const langEn = document.getElementById('lang-en');
        const langTc = document.getElementById('lang-tc');
        const mobileLangEn = document.getElementById('mobile-lang-en');
        const mobileLangTc = document.getElementById('mobile-lang-tc');

        const setLanguage = (lang) => {
            localStorage.setItem('language', lang);
            this.updateLanguageUI();
            const savedTab = localStorage.getItem('activeTab') || this.getDefaultNewsTab();
            this.switchTab(savedTab);
            
            if (desktopMenu && desktopMenuBtn) {
                desktopMenu.classList.add('hidden');
                desktopMenuBtn.setAttribute('aria-expanded', 'false');
            }
        };

        if (langEn) langEn.addEventListener('click', () => setLanguage('en'));
        if (langTc) langTc.addEventListener('click', () => setLanguage('tc'));
        if (mobileLangEn) mobileLangEn.addEventListener('click', () => {
            setLanguage('en');
            this.closeMobileMenu();
        });
        if (mobileLangTc) mobileLangTc.addEventListener('click', () => {
            setLanguage('tc');
            this.closeMobileMenu();
        });

        // Default tab
        let savedTab = localStorage.getItem('activeTab');
        if (!savedTab || !['weather', 'edb', 'air-quality', 'news', 'news-evening'].includes(savedTab)) {
            savedTab = this.getDefaultNewsTab();
        }
        localStorage.setItem('activeTab', savedTab);
        this.switchTab(savedTab);
    },

    getDefaultNewsTab: function() {
        const hour = new Date().getHours();
        // Morning: 7:00 AM to 6:59 PM (7 to 18)
        // Evening: 7:00 PM to 6:59 AM (19 to 6)
        if (hour >= 19 || hour < 7) {
            return 'news-evening';
        }
        return 'news';
    },

    closeMobileMenu: function() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
            const menuToggleButton = document.getElementById('mobile-menu-button');
            if (menuToggleButton) {
                menuToggleButton.setAttribute('aria-expanded', 'false');
            }
        }
    },

    initDarkMode: function() {
        // Handled in index.html for faster loading
    },

    toggleDarkMode: function() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', isDark);
        
        if (typeof gtag === 'function') {
            gtag('event', 'dark_mode_toggle', {
                enabled: isDark
            });
        }
    },

    initLanguage: function() {
        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';
        this.updateLanguageUI();
    },

    updateLanguageUI: function() {
        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';
        if (!this.translations || !this.translations[lang]) return;
        const t = this.translations[lang];

        // Update HTML lang attribute
        document.documentElement.setAttribute('lang', lang === 'tc' ? 'zh-Hant' : 'en');

        // Update UI elements
        const tagline = document.querySelector('.bg-white.dark\\:bg-zinc-900.border-b div');
        if (tagline) tagline.textContent = t.tagline;

        const navNews = document.getElementById('tab-news');
        const navWeather = document.getElementById('tab-weather');
        const navSchool = document.getElementById('tab-edb');
        const navAir = document.getElementById('tab-air-quality');
        
        if (navNews) navNews.textContent = t.news;
        if (navWeather) navWeather.textContent = t.weather;
        if (navSchool) navSchool.textContent = t.school;
        if (navAir) navAir.textContent = t.airQuality;

        const mNavNews = document.getElementById('mobile-tab-news');
        const mNavWeather = document.getElementById('mobile-tab-weather');
        const mNavSchool = document.getElementById('mobile-tab-edb');
        const mNavAir = document.getElementById('mobile-tab-air-quality');
        
        if (mNavNews) mNavNews.textContent = t.news;
        if (mNavWeather) mNavWeather.textContent = t.weather;
        if (mNavSchool) mNavSchool.textContent = t.school;
        if (mNavAir) mNavAir.textContent = t.airQuality;

        const darkText = document.querySelector('#desktop-toggle-dark span.dark\\:hidden');
        const lightText = document.querySelector('#desktop-toggle-dark span.hidden.dark\\:block');
        if (darkText) darkText.textContent = t.switchToNightMode;
        if (lightText) lightText.textContent = t.switchToDayMode;

        const mDarkText = document.querySelector('#mobile-toggle-dark span.dark\\:hidden');
        const mLightText = document.querySelector('#mobile-toggle-dark span.hidden.dark\\:block');
        if (mDarkText) mDarkText.textContent = t.switchToNightMode;
        if (mLightText) mLightText.textContent = t.switchToDayMode;

        const desktopLangLabel = document.getElementById('desktop-lang-label');
        if (desktopLangLabel) desktopLangLabel.textContent = t.language;

        const mobileLangLabel = document.getElementById('mobile-lang-label');
        if (mobileLangLabel) mobileLangLabel.textContent = t.language;

        const contactUs = document.querySelector('footer a[href^="mailto:"]');
        if (contactUs) contactUs.textContent = t.contactUs;

        const footerRights = document.querySelector('footer div.bg-zinc-800 p');
        if (footerRights) {
            const year = new Date().getFullYear();
            footerRights.innerHTML = `${year} ${t.rights} <a href="https://www.base87.tech" target="_blank" class="underline">Base87 Technologies</a>`;
        }

        // Update language button styles
        const updateLangButtons = (enBtn, tcBtn, activeClass, inactiveClass) => {
            if (enBtn && tcBtn) {
                if (lang === 'en') {
                    enBtn.className = activeClass;
                    tcBtn.className = inactiveClass;
                } else {
                    enBtn.className = inactiveClass;
                    tcBtn.className = activeClass;
                }
            }
        };

        const desktopActive = "flex items-center w-full px-2 py-2 text-sm rounded-md transition-colors bg-blue-50 dark:bg-zinc-700 text-blue-600 dark:text-blue-400 font-medium";
        const desktopInactive = "flex items-center w-full px-2 py-2 text-sm rounded-md transition-colors text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700";
        updateLangButtons(document.getElementById('lang-en'), document.getElementById('lang-tc'), desktopActive, desktopInactive);

        const mobileActive = "flex items-center w-full px-3 py-3 text-sm rounded-md transition-colors bg-blue-50 dark:bg-zinc-700 text-blue-600 dark:text-blue-400 font-medium";
        const mobileInactive = "flex items-center w-full px-3 py-3 text-sm rounded-md transition-colors text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800";
        updateLangButtons(document.getElementById('mobile-lang-en'), document.getElementById('mobile-lang-tc'), mobileActive, mobileInactive);
    },

    switchTab: async function(tabId, isUserInitiated = false) {
        if (isUserInitiated && typeof gtag === 'function') {
            gtag('event', 'tab_click', {
                tab_id: tabId
            });
        }

        // Update tab UI
        this.tabs.forEach(tab => {
            const currentTabId = tab.id.replace('tab-', '').replace('mobile-', '');
            if (currentTabId === tabId || (tabId === 'news-evening' && currentTabId === 'news')) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Show loading
        // const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';
        this.contentArea.innerHTML = `
            <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        `;

        // Fetch and Render
        try {
            let data;
            if (tabId === 'weather') {
                data = await api.getWeather();
                this.formatData(data);
                this.renderWeather(data);
            } else if (tabId === 'edb') {
                data = await api.getEDB();
                this.formatData(data);
                this.renderEDB(data);
            } else if (tabId === 'air-quality') {
                data = await api.getAirQuality();
                this.formatData(data);
                this.renderAirQuality(data);
            } else if (tabId === 'news' || tabId === 'news-evening') {
                if (tabId === 'news-evening') {
                    data = await api.getEveningNews();
                } else {
                    data = await api.getNews();
                }
                this.formatData(data);
                this.renderNews(data, tabId === 'news-evening' ? 'evening' : 'morning');
            }
        } catch (error) {
            const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';
            const errorMsg = (this.translations && this.translations[lang] && this.translations[lang].errorLoading) || "Error loading data.";
            this.contentArea.innerHTML = `<div class="text-red-500">${errorMsg}</div>`;
        }
    },

    formatData: function(data) {
        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';
        if (data.body) data.body = data.body.replace(/\\n/g, '\n');
        if (data.body1) data.body1 = data.body1.replace(/\\n/g, '\n');
        
        if (data.updated_at) {
            if (typeof dayjs !== 'undefined') {
                const userTimezone = dayjs.tz.guess();
                const date = dayjs(data.updated_at).tz(userTimezone);
                // Use Intl.DateTimeFormat to get a short timezone name for the user's timezone
                // and fall back to the numeric offset (Z) if unavailable, instead of hardcoding 'HKT'.
                const parts = new Intl.DateTimeFormat(
                    'en-US',
                    { timeZone: userTimezone, timeZoneName: 'short' })
                    .formatToParts(date.toDate());
                const tzPart = parts.find(p => p.type === 'timeZoneName');
                const tzName = tzPart && tzPart.value ? tzPart.value : date.format('Z');
                
                if (lang === 'tc') {
                    data.formattedDate = `(${date.format('h:mmA | ddd | YYYY年M月D日')} ${tzName})`;
                } else {
                    data.formattedDate = `(${date.format('h:mmA | ddd | D MMM, YYYY')} ${tzName})`;
                }
            } else {
                const date = new Date(data.updated_at);
                const hours = date.getUTCHours();
                const minutes = date.getUTCMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                const displayMinutes = minutes.toString().padStart(2, '0');
                
                if (lang === 'tc') {
                    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                    const dayName = days[date.getUTCDay()];
                    const year = date.getUTCFullYear();
                    const month = date.getUTCMonth() + 1;
                    const day = date.getUTCDate();
                    data.formattedDate = `(${displayHours}:${displayMinutes}${ampm} | ${dayName} | ${year}年${month}月${day}日)`;
                } else {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dayName = days[date.getUTCDay()];
                    
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthName = months[date.getUTCMonth()];
                    const day = date.getUTCDate();
                    const year = date.getUTCFullYear();
                    
                    data.formattedDate = `(${displayHours}:${displayMinutes}${ampm} | ${dayName} | ${day} ${monthName}, ${year})`;
                }
            }
        } else {
            data.formattedDate = '';
        }
    },

    parseMarkdown: function(text) {
        if (!text) return '';
        let bodyHtml = text;
        if (typeof marked !== 'undefined' && marked.parse) {
            // marked v12+ use options in parse or marked.setOptions
            bodyHtml = marked.parse(text, { gfm: true, breaks: true });
        } else {
            // Fallback: replace \n with <br>
            bodyHtml = text.replace(/\n/g, '<br>');
        }
        return typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(bodyHtml) : bodyHtml;
    },

    renderWeather: function(data) {
        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';
        if (!this.translations || !this.translations[lang]) return;
        const t = this.translations[lang];
        const title = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.title) : data.title;
        const body = this.parseMarkdown(data.body);
        const body1 = this.parseMarkdown(data.body1);

        this.contentArea.innerHTML = `
            <div class="alert-banner dark:bg-zinc-900 flex items-center gap-3">
                <span class="text-blue-600 dark:text-blue-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </span>
                <span class="text-gray-700 dark:text-zinc-200 font-medium">${title}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="md:col-span-2 card">
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-6">${t.weatherTitle} ${data.formattedDate}</h2>
                    
                    <div class="space-y-6 text-gray-600 dark:text-zinc-300 markdown-content">
                        ${body}
                    </div>
                </div>

                <div class="card">
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-6">${t.summaryTitle}</h2>
                    <div class="text-gray-600 dark:text-zinc-300 leading-relaxed markdown-content">${body1}</div>
                </div>
            </div>
        `;
    },

    renderEDB: function(data) {
        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';
        if (!this.translations || !this.translations[lang]) return;
        const t = this.translations[lang];
        const id = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.id) : data.id;
        const body = this.parseMarkdown(data.body);

        this.contentArea.innerHTML = `
            <div class="w-full card">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-6">${id.toUpperCase()} ${t.alert} ${data.formattedDate}</h2>
                
                <div class="space-y-6 text-gray-600 dark:text-zinc-300 markdown-content">
                    ${body}
                </div>
            </div>
        `;
    },

    renderAirQuality: function(data) {
        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';
        if (!this.translations || !this.translations[lang]) return;
        const t = this.translations[lang];
        const body = this.parseMarkdown(data.body);
        const body1 = this.parseMarkdown(data.body1);

        this.contentArea.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="md:col-span-2 card">
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-6">${t.stationReadings} ${data.formattedDate}</h2>
                    <div class="text-gray-600 dark:text-zinc-300 leading-relaxed markdown-content">${body1}</div>
                </div>

                <div class="card">
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-6">${t.commentary}</h2>
                    
                    <div class="space-y-6 text-gray-600 dark:text-zinc-300 markdown-content">
                        ${body}
                    </div>
                </div>
            </div>
        `;
    },

    renderNews: function(data, type = 'morning') {
        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';
        if (!this.translations || !this.translations[lang]) return;
        const t = this.translations[lang];
        const title = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.title) : data.title;
        const body = this.parseMarkdown(data.body);
        const body1 = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.body1) : data.body1;

        // Calculate reading time based on rendered text, not raw markdown
        let readingTime = '';
        if (data.body) {
            const wordsPerMinute = 225;
            // Derive plain text from rendered markdown HTML
            const tempContainer = typeof document !== 'undefined' ? document.createElement('div') : null;
            let plainText = '';
            if (tempContainer) {
                tempContainer.innerHTML = body || '';
                plainText = (tempContainer.textContent || tempContainer.innerText || '').trim();
            } else {
                // Fallback: use raw body text if document is not available
                plainText = String(data.body).trim().replace(/[#_*`>\-\+\[\]\(\)!]/g, '');
            }
            if (plainText) {
                let words;
                if (lang === 'tc') {
                    // For Chinese, count characters
                    words = plainText.replace(/\s+/g, '').length;
                    // Chinese reading speed is roughly 300-500 characters per minute
                    const charsPerMinute = 400;
                    const minutes = Math.ceil(words / charsPerMinute);
                    readingTime = `<span class="block md:inline-block text-gray-600 dark:text-zinc-400 text-base font-normal md:ml-1"><span class="hidden md:inline">· </span>${minutes} ${t.minRead}</span>`;
                } else {
                    words = plainText.split(/\s+/).length;
                    const minutes = Math.ceil(words / wordsPerMinute);
                    readingTime = `<span class="block md:inline-block text-gray-600 dark:text-zinc-400 text-base font-normal md:ml-1"><span class="hidden md:inline">· </span>${minutes} ${t.minRead}</span>`;
                }
            }
        }

        this.contentArea.innerHTML = `
            <div class="mb-8 flex justify-center">
                <div class="inline-flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl" role="tablist" aria-label="News time of day">
                    <button
                        class="px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center ${type === 'morning' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}"
                        id="news-morning"
                        role="tab"
                        aria-selected="${type === 'morning' ? 'true' : 'false'}"
                        tabindex="${type === 'morning' ? '0' : '-1'}"
                        aria-controls="news-panel"
                    >
                        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>
                        ${t.morning}
                    </button>
                    <button
                        class="px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center ${type === 'evening' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}"
                        id="news-evening"
                        role="tab"
                        aria-selected="${type === 'evening' ? 'true' : 'false'}"
                        tabindex="${type === 'evening' ? '0' : '-1'}"
                        aria-controls="news-panel"
                    >
                        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        ${t.evening}
                    </button>
                </div>
            </div>
            <div
                class="w-full card"
                role="tabpanel"
                id="news-panel"
                aria-labelledby="${type === 'morning' ? 'news-morning' : 'news-evening'}"
            >
                <h2 class="text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-6">${title} ${data.formattedDate}${readingTime}</h2>
                <div class="text-gray-500 text-sm italic mb-6">
                    ${type === 'morning' ? t.morningUpdate : t.eveningUpdate}
                </div>
                ${lang === 'tc'
                    ? `<div class="text-gray-500 text-sm italic mb-6">由AI翻译</div>`
                    : ''
                }

                
                <div class="space-y-6 text-gray-600 dark:text-zinc-300 markdown-content">
                    ${body}
                </div>
                ${body1 ? `<div class="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 text-sm italic">${body1}</div>` : ''}
            </div>
        `;

        const morningTab = document.getElementById('news-morning');
        const eveningTab = document.getElementById('news-evening');

        morningTab.onclick = () => {
            localStorage.setItem('activeTab', 'news');
            this.switchTab('news', true);
        };
        eveningTab.onclick = () => {
            localStorage.setItem('activeTab', 'news-evening');
            this.switchTab('news-evening', true);
        };

        const handleTabKeydown = (event) => {
            const key = event.key;
            if (key !== 'ArrowRight' && key !== 'ArrowLeft') {
                return;
            }

            event.preventDefault();

            const target = event.currentTarget;
            let nextTab;

            if (key === 'ArrowRight') {
                nextTab = target.id === 'news-morning' ? eveningTab : morningTab;
            } else if (key === 'ArrowLeft') {
                nextTab = target.id === 'news-evening' ? morningTab : eveningTab;
            }

            if (nextTab) {
                nextTab.focus();
                nextTab.click();
            }
        };

        morningTab.addEventListener('keydown', handleTabKeydown);
        eveningTab.addEventListener('keydown', handleTabKeydown);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, UI };
} else {
    document.addEventListener('DOMContentLoaded', () => UI.init());
}
