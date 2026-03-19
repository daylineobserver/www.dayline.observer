const URL = "https://api.dayline.observer"
const api = {
    getWeather: async () => {
        const res = await fetch(URL + "/weather")
        return res.json()
    },
    getEDB: async () => {
        const res = await fetch(URL + "/edb")
        return res.json()
    },
    getAirQuality: async () => {
        const res = await fetch(URL + "/aqi")
        return res.json()
    },
    getNews: async () => {
        const res = await fetch(URL + "/news")
        return res.json()
    },
    getEveningNews: async () => {
        const res = await fetch(URL + "/news1")
        return res.json()
    }
};

// UI Controller
const UI = {
    contentArea: typeof document !== 'undefined' ? document.getElementById('content-area') : null,
    tabs: typeof document !== 'undefined' ? document.querySelectorAll('.tab-btn') : [],

    init: function() {
        if (!this.contentArea) this.contentArea = document.getElementById('content-area');
        if (this.tabs.length === 0) this.tabs = document.querySelectorAll('.tab-btn');

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
                
                // Close mobile menu if open
                const mobileMenu = document.querySelector('.mobile-menu');
                if (mobileMenu) {
                    mobileMenu.classList.add('hidden');
                    const menuToggleButton = document.getElementById('mobile-menu-button');
                    if (menuToggleButton) {
                        menuToggleButton.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });

        // Mobile menu toggle
        const menuBtn = document.getElementById('mobile-menu-button');
        const mobileMenu = document.querySelector('.mobile-menu');

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
            this.contentArea.innerHTML = `<div class="text-red-500">Error loading data.</div>`;
        }
    },

    formatData: function(data) {
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
                data.formattedDate = `(${date.format('h:mmA | ddd | D MMM, YYYY')} ${tzName})`;
            } else {
                const date = new Date(data.updated_at);
                const hours = date.getUTCHours();
                const minutes = date.getUTCMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                const displayMinutes = minutes.toString().padStart(2, '0');
                
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayName = days[date.getUTCDay()];
                
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = months[date.getUTCMonth()];
                const day = date.getUTCDate();
                const year = date.getUTCFullYear();
                
                data.formattedDate = `(${displayHours}:${displayMinutes}${ampm} | ${dayName} | ${day} ${monthName}, ${year})`;
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
        const title = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.title) : data.title;
        const body = this.parseMarkdown(data.body);
        const body1 = this.parseMarkdown(data.body1);

        this.contentArea.innerHTML = `
            <div class="alert-banner flex items-center gap-3">
                <span class="text-blue-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </span>
                <span class="text-gray-700 font-medium">${title}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="md:col-span-2 card">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Weather ${data.formattedDate}</h2>
                    
                    <div class="space-y-6 text-gray-600 markdown-content">
                        ${body}
                    </div>
                </div>

                <div class="card">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Summary</h2>
                    <div class="text-gray-600 leading-relaxed markdown-content">${body1}</div>
                </div>
            </div>
        `;
    },

    renderEDB: function(data) {
        const id = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.id) : data.id;
        const body = this.parseMarkdown(data.body);

        this.contentArea.innerHTML = `
            <div class="w-full card">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">${id.toUpperCase()} Alert ${data.formattedDate}</h2>
                
                <div class="space-y-6 text-gray-600 markdown-content">
                    ${body}
                </div>
            </div>
        `;
    },

    renderAirQuality: function(data) {
        const body = this.parseMarkdown(data.body);
        const body1 = this.parseMarkdown(data.body1);

        this.contentArea.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="md:col-span-2 card">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Station Readings ${data.formattedDate}</h2>
                    <div class="text-gray-600 leading-relaxed markdown-content">${body1}</div>
                </div>

                <div class="card">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Commentary</h2>
                    
                    <div class="space-y-6 text-gray-600 markdown-content">
                        ${body}
                    </div>
                </div>
            </div>
        `;
    },

    renderNews: function(data, type = 'morning') {
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
                const words = plainText.split(/\s+/).length;
                const minutes = Math.ceil(words / wordsPerMinute);
                readingTime = `<span class="block md:inline-block text-gray-600 text-base font-normal md:ml-1"><span class="hidden md:inline">· </span>${minutes} min read</span>`;
            }
        }

        this.contentArea.innerHTML = `
            <div class="mb-8 flex justify-center">
                <div class="inline-flex p-1 bg-gray-100 rounded-xl" role="tablist" aria-label="News time of day">
                    <button
                        class="px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center ${type === 'morning' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
                        id="news-morning"
                        role="tab"
                        aria-selected="${type === 'morning' ? 'true' : 'false'}"
                        tabindex="${type === 'morning' ? '0' : '-1'}"
                        aria-controls="news-panel"
                    >
                        <img src="resources/sun.svg" alt="" aria-hidden="true" class="w-4 h-4 mr-1.5">
                        Morning
                    </button>
                    <button
                        class="px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center ${type === 'evening' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
                        id="news-evening"
                        role="tab"
                        aria-selected="${type === 'evening' ? 'true' : 'false'}"
                        tabindex="${type === 'evening' ? '0' : '-1'}"
                        aria-controls="news-panel"
                    >
                        <img src="resources/moon.svg" alt="" aria-hidden="true" class="w-4 h-4 mr-1.5">
                        Evening
                    </button>
                </div>
            </div>
            <div
                class="w-full card"
                role="tabpanel"
                id="news-panel"
                aria-labelledby="${type === 'morning' ? 'news-morning' : 'news-evening'}"
            >
                <h2 class="text-2xl font-bold text-gray-800 mb-6">${title} ${data.formattedDate}${readingTime}</h2>
                
                <div class="space-y-6 text-gray-600 markdown-content">
                    ${body}
                </div>
                ${body1 ? `<div class="mt-6 pt-6 border-t border-gray-100 text-gray-500 text-sm italic">${body1}</div>` : ''}
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
