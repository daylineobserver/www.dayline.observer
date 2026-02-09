const URL = "https://api.remindify.me"
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
    }
};

// UI Controller
const UI = {
    contentArea: typeof document !== 'undefined' ? document.getElementById('content-area') : null,
    tabs: typeof document !== 'undefined' ? document.querySelectorAll('.tab-btn') : [],

    init: function() {
        if (!this.contentArea) this.contentArea = document.getElementById('content-area');
        if (this.tabs.length === 0) this.tabs = document.querySelectorAll('.tab-btn');

        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.id.replace('tab-', '');
                localStorage.setItem('activeTab', tabId);
                this.switchTab(tabId);
            });
        });

        // Default tab
        const savedTab = localStorage.getItem('activeTab') || 'news';
        this.switchTab(savedTab);
    },

    switchTab: async function(tabId) {
        // Update tab UI
        this.tabs.forEach(tab => {
            if (tab.id === `tab-${tabId}`) {
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
            } else if (tabId === 'news') {
                data = await api.getNews();
                this.formatData(data);
                this.renderNews(data);
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

    renderWeather: function(data) {
        const title = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.title) : data.title;
        const body = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.body) : data.body;
        const body1 = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.body1) : data.body1;

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
                    
                    <div class="space-y-6 text-gray-600 whitespace-pre-line">
                        ${body}
                    </div>
                </div>

                <div class="card">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Summary</h2>
                    <p class="text-gray-600 leading-relaxed whitespace-pre-line">${body1}</p>
                </div>
            </div>
        `;
    },

    renderEDB: function(data) {
        const id = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.id) : data.id;
        const body = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.body) : data.body;

        this.contentArea.innerHTML = `
            <div class="max-w-2xl mx-left card">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">${id.toUpperCase()} Alert ${data.formattedDate}</h2>
                
                <div class="space-y-6 text-gray-600 whitespace-pre-line">
                    ${body}
                </div>
            </div>
        `;
    },

    renderAirQuality: function(data) {
        const body = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.body) : data.body;
        const body1 = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.body1) : data.body1;

        this.contentArea.innerHTML = `
            <div class="max-w-2xl mx-left card">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    Air Quality Alert ${data.formattedDate}
                </h2>
                
                <div class="space-y-4 text-gray-600">
                    <div class="whitespace-pre-line">
                        <p class="font-semibold text-gray-800 mb-1">Warnings:</p>
                        ${body}
                    </div>
                    <div class="whitespace-pre-line">
                        <p class="font-semibold text-gray-800 mb-1">Station Readings:</p>
                        ${body1}
                    </div>
                </div>
            </div>
        `;
    },

    renderNews: function(data) {
        let bodyHtml = data.body;
        if (typeof marked !== 'undefined' && marked.parse) {
            bodyHtml = marked.parse(data.body);
        }

        const title = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.title) : data.title;
        const body = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(bodyHtml) : bodyHtml;
        const body1 = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data.body1) : data.body1;

        this.contentArea.innerHTML = `
            <div class="max-w-2xl mx-left card">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">${title} ${data.formattedDate}</h2>
                
                <div class="space-y-6 text-gray-600 markdown-content">
                    ${body}
                </div>
                ${body1 ? `<div class="mt-6 pt-6 border-t border-gray-100 text-gray-500 text-sm italic">${body1}</div>` : ''}
            </div>
        `;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, UI };
} else {
    document.addEventListener('DOMContentLoaded', () => UI.init());
}
