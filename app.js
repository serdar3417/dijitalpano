const app = {
    state: {
        currentPage: 'dashboard',
        clients: [],
        cases: [],
        legislation: [],
        decisions: [], // Yargıtay Kararları
        petitions: [], // Dava Dilekçeleri
        activityLog: [],
        editingClientId: null,
        editingArticleId: null,
        editingDecisionId: null,
        currentLawId: null // To track which law we are adding/editing articles for
    },

    init: function () {
        console.log("Uygulama başlatılıyor...");

        // Inject Custom Styles for Highlighter & Media
        const style = document.createElement('style');
        style.textContent = `
            .highlight-yellow { background-color: #fef08a; }
            .highlight-green { background-color: #bbf7d0; }
            .highlight-blue { background-color: #bfdbfe; }
            .highlight-pink { background-color: #fbcfe8; }
            .highlight-toolbar { position: absolute; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); display: flex; gap: 5px; padding: 5px; z-index: 1000; }
            .color-btn { width: 20px; height: 20px; border-radius: 50%; cursor: pointer; border: 1px solid #ddd; }
        `;
        document.head.appendChild(style);

        this.loadData();
        this.router.init();
        this.ui.init();
    },

    loadData: function () {
        // Try to load from localStorage first for persistence
        const storedData = localStorage.getItem('lawyerAppState');

        if (storedData) {
            const parsed = JSON.parse(storedData);
            this.state.clients = parsed.clients || [];
            this.state.cases = parsed.cases || [];
            this.state.legislation = parsed.legislation || [];
            this.state.decisions = parsed.decisions || [];
            this.state.activityLog = parsed.activityLog || [];
            this.state.todos = parsed.todos || [];
            this.state.finance = parsed.finance || { transactions: [] };
        } else if (typeof mockData !== 'undefined') {
            // Fallback to mock data
            this.state.clients = [...mockData.clients];
            this.state.cases = [...mockData.cases];
            // Deep copy legislation to avoid reference issues
            this.state.legislation = JSON.parse(JSON.stringify(mockData.legislation));
            this.state.decisions = [];
            this.state.activityLog = [...mockData.activityLog];
            this.state.todos = [];
            this.state.finance = { transactions: [] };
            this.saveData(); // Save initial data to local storage
        }

        this.updateDashboardStats();
    },

    saveData: function () {
        localStorage.setItem('lawyerAppState', JSON.stringify({
            clients: this.state.clients,
            cases: this.state.cases,
            legislation: this.state.legislation,
            decisions: this.state.decisions,
            petitions: this.state.petitions,
            todos: this.state.todos,
            finance: this.state.finance,
            activityLog: this.state.activityLog
        }));
    },

    updateDashboardStats: function () {
        const activeClients = this.state.clients.filter(c => c.status === 'Aktif').length;
        const activeCases = this.state.cases.filter(c => c.status !== 'Kapalı').length;

        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);

        const upcomingHearings = this.state.cases.filter(c => {
            if (!c.nextHearing) return false;
            const hearingDate = new Date(c.nextHearing);
            return hearingDate >= today && hearingDate <= nextMonth;
        }).length;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('totalClients', activeClients);
        setVal('dashTotalClients', activeClients); // Dashboard card
        setVal('activeCases', activeCases);
        setVal('dashActiveCases', activeCases); // Dashboard card
        setVal('upcomingHearings', upcomingHearings);
        setVal('upcomingHearingsCount', upcomingHearings);
    },

    router: {
        init: function () {
            this.navigate('dashboard');
        },

        navigate: function (page, params = null) {
            app.state.currentPage = page;
            app.ui.closeMobileMenu();

            document.querySelectorAll('.main-nav li').forEach(li => li.classList.remove('active'));
            const navItems = document.querySelectorAll('.main-nav li');
            navItems.forEach(item => {
                const onclickVal = item.getAttribute('onclick');
                if (onclickVal && onclickVal.includes(page) && !['legislation-detail', 'decision-detail', 'petition-detail'].includes(page)) {
                    item.classList.add('active');
                } else if ((page === 'legislation-detail' && onclickVal.includes('legislation')) ||
                    (page === 'decision-detail' && onclickVal.includes('decisions')) ||
                    (page === 'petition-detail' && onclickVal.includes('petitions'))) {
                    item.classList.add('active');
                }
            });

            const titles = {
                'dashboard': 'Genel Bakış',
                'clients': 'Müvekkil Yönetimi',
                'cases': 'Dava Takibi',
                'legislation': 'Mevzuat Kütüphanesi',
                'legislation-detail': 'Kanun Detayı',
                'decisions': 'Yargıtay Kararları',
                'decision-detail': 'Karar Detayı',
                'petitions': 'Dava Dilekçeleri',
                'petition-detail': 'Dilekçe Detayı',
                'tools': 'Hukuki Araçlar',
                'todos': 'Yapılacaklar Listesi',
                'calendar': 'Hukuk Ajandası',
                'finance': 'Muhasebe & Finans'
            };
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) pageTitle.textContent = titles[page] || 'Sayfa';

            app.ui.renderPage(page, params);
        }
    },

    ui: {
        init: function () {
            // Setup Hamburger Menu Event
            const toggleBtn = document.getElementById('sidebarToggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => this.toggleMobileMenu());
            }

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                const sidebar = document.querySelector('.sidebar');
                const toggle = document.getElementById('sidebarToggle');
                if (window.innerWidth <= 768 &&
                    sidebar &&
                    sidebar.classList.contains('active') &&
                    !sidebar.contains(e.target) &&
                    !toggle.contains(e.target)) {
                    this.closeMobileMenu();
                }
            });

            // Bind Modal Save Button listener removed - handled by openModal per instance

            // Restore theme and font size
            const theme = localStorage.getItem('appTheme');
            if (theme) document.body.className = theme;

            const fontSize = localStorage.getItem('appFontSize');
            if (fontSize) {
                document.documentElement.style.fontSize = fontSize + 'px';
                const percentage = Math.round((parseInt(fontSize) / 16) * 100) + '%';
                const el = document.getElementById('currentFontSize');
                if (el) el.textContent = percentage;
            }

            // Restore App Customization
            const appSettings = JSON.parse(localStorage.getItem('appSettings')) || {};
            if (appSettings.title) {
                document.querySelector('.logo-area h1').textContent = appSettings.title;
                document.title = appSettings.title + " - Profesyonel Hukuk Yönetimi";
                const titleInput = document.getElementById('settingAppTitle');
                if (titleInput) titleInput.value = appSettings.title;
            }
            if (appSettings.font) {
                document.body.style.fontFamily = appSettings.font;
                const fontSelect = document.getElementById('settingAppFont');
                if (fontSelect) fontSelect.value = appSettings.font;
            }

            // Restore Profile
            const userProfile = localStorage.getItem('userProfile');
            if (userProfile) {
                const user = JSON.parse(userProfile);
                app.state.user = user;
                const nameEl = document.querySelector('.user-name');
                const roleEl = document.querySelector('.user-role');
                if (nameEl) nameEl.textContent = user.name;
                if (roleEl) roleEl.textContent = user.role;

                // Pre-fill modal
                document.getElementById('profileName').value = user.name;
                document.getElementById('profileRole').value = user.role;
            } else {
                app.state.user = { name: 'Av. Kullanıcı', role: 'Yönetici' }; // Default
            }

        },

        toggleMobileMenu: function () {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('active');
        },

        closeMobileMenu: function () {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.classList.remove('active');
        },

        // --- SETTINGS & THEME ---
        openSettingsModal: function () {
            document.getElementById('settingsModal').classList.remove('hidden');
        },

        closeSettingsModal: function () {
            document.getElementById('settingsModal').classList.add('hidden');
        },

        setTheme: function (themeName) {
            document.body.className = themeName;
            localStorage.setItem('appTheme', themeName);
        },

        saveSettings: function () {
            const title = document.getElementById('settingAppTitle').value;
            const font = document.getElementById('settingAppFont').value;

            if (title) {
                document.querySelector('.logo-area h1').innerHTML = title.replace('As', '<span class="gold-text">As</span>'); // Keep partial styling? Or just simple text?
                // User might lose the "As" coloring if they change it completely. Let's just set textContent for valid customization or try to preserve if matches.
                // Simpler: Just set innerHTML, user can't easily input HTML.
                // Let's assume user just types text. We can apply generic gold-text to last 2 chars if we want, but user asked to change "HukukAs".
                // If they type "MyFir", it will be "MyFir".
                document.querySelector('.logo-area h1').textContent = title;
                document.title = title + " - Profesyonel Hukuk Yönetimi";
            }

            if (font) {
                document.body.style.fontFamily = font;
            }

            localStorage.setItem('appSettings', JSON.stringify({ title, font }));
            this.closeSettingsModal();
        },

        changeFontSize: function (delta) {
            const html = document.documentElement;
            let currentSize = parseFloat(window.getComputedStyle(html, null).getPropertyValue('font-size'));
            let newSize = currentSize + delta;

            // Limits
            if (newSize < 12) newSize = 12;
            if (newSize > 24) newSize = 24;

            html.style.fontSize = newSize + 'px';
            localStorage.setItem('appFontSize', newSize);

            const el = document.getElementById('currentFontSize');
            if (el) el.textContent = Math.round((newSize / 16) * 100) + '%';
        },

        globalSearch: function (query) {
            const resultsContainer = document.getElementById('globalSearchResults');
            if (!query || query.length < 2) {
                resultsContainer.style.display = 'none';
                return;
            }

            const term = query.toLowerCase();
            let results = [];

            // Search Clients
            app.state.clients.forEach(c => {
                if (c.name.toLowerCase().includes(term) || c.phone.includes(term)) {
                    results.push({ type: 'Müvekkil', text: c.name, id: c.id, icon: 'fa-user', route: 'clients' }); // Route to clients list? Ideally detailed view or filter.
                }
            });

            // Search Cases
            app.state.cases.forEach(c => {
                if (c.title.toLowerCase().includes(term) || c.court.toLowerCase().includes(term)) {
                    results.push({ type: 'Dava', text: c.title, id: c.id, icon: 'fa-gavel', route: 'cases' });
                }
            });

            // Search Decisions
            app.state.decisions.forEach(d => {
                if (d.konu.toLowerCase().includes(term) || d.daire.toLowerCase().includes(term)) {
                    results.push({ type: 'Karar', text: `${d.daire} - ${d.konu}`, id: d.id, icon: 'fa-balance-scale', route: 'decision-detail', param: d.id });
                }
            });

            // Search Legislation (Titles only for speed)
            app.state.legislation.forEach(l => {
                if (l.name.toLowerCase().includes(term) || l.code.toLowerCase().includes(term)) {
                    results.push({ type: 'Mevzuat', text: `${l.code} - ${l.name}`, id: l.id, icon: 'fa-book', route: 'legislation-detail', param: l.id });
                }
            });


            if (results.length > 0) {
                let html = '<ul style="list-style:none; padding:0; margin:0;">';
                results.slice(0, 10).forEach(r => { // Limit to 10
                    const onclick = r.route === 'clients' || r.route === 'cases' ? `app.router.navigate('${r.route}');` : `app.router.navigate('${r.route}', '${r.param}');`;
                    // For clients/cases, navigating to list isn't perfect but simple.
                    html += `
                        <li onclick="${onclick} document.getElementById('globalSearchResults').style.display='none';" style="padding:10px; border-bottom:1px solid #eee; cursor:pointer; display:flex; align-items:center;">
                            <i class="fas ${r.icon}" style="margin-right:10px; color:var(--primary-color); width:20px; text-align:center;"></i>
                            <div>
                                <div style="font-weight:600; font-size:0.9rem;">${r.text}</div>
                                <div style="font-size:0.75rem; color:#666;">${r.type}</div>
                            </div>
                        </li>
                     `;
                });
                html += '</ul>';
                resultsContainer.innerHTML = html;
                resultsContainer.style.display = 'block';
            } else {
                resultsContainer.innerHTML = '<div style="padding:10px; color:#666; text-align:center;">Sonuç bulunamadı</div>';
                resultsContainer.style.display = 'block';
            }
        },

        // --- FILE HANDLING ---
        openFileModal: function () {
            document.getElementById('fileModal').classList.remove('hidden');
        },

        closeFileModal: function () {
            document.getElementById('fileModal').classList.add('hidden');
            document.getElementById('fileViewer').src = '';
        },

        handleFileSelect: function (input) {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const url = URL.createObjectURL(file);
                document.getElementById('fileViewer').src = url;
            }
        },

        // --- HELPER: Media Inputs ---
        getMediaInputHtml: function (prefix) {
            return `
                <div class="media-inputs" style="margin-top:1rem; border-top:1px solid #eee; padding-top:1rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-weight:600;">Medya Ekle</label>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                        <label class="btn secondary small" style="cursor:pointer;">
                            <i class="fas fa-camera"></i> Foto Çek
                            <input type="file" id="${prefix}Camera" capture="environment" accept="image/*" hidden onchange="app.ui.handleMediaSelect(this, '${prefix}Preview')">
                        </label>
                        <label class="btn secondary small" style="cursor:pointer;">
                            <i class="fas fa-image"></i> Galeri
                            <input type="file" id="${prefix}File" accept="image/*,video/*" multiple hidden onchange="app.ui.handleMediaSelect(this, '${prefix}Preview')">
                        </label>
                        <button class="btn secondary small" onclick="app.ui.addLinkInput('${prefix}Preview')"><i class="fas fa-link"></i> Link</button>
                    </div>
                    <div id="${prefix}Preview" class="media-preview-area" style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:10px;"></div>
                </div>
            `;
        },

        handleMediaSelect: function (input, previewId) {
            const container = document.getElementById(previewId);
            if (!container) return;

            Array.from(input.files).forEach(file => {
                const wrapper = document.createElement('div');
                wrapper.className = 'media-item';
                wrapper.style.cssText = 'position:relative; width:80px; height:80px; border:1px solid #ddd; border-radius:4px; overflow:hidden;';

                const type = file.type.startsWith('video') ? 'video' : 'image';
                const url = URL.createObjectURL(file);

                let content = '';
                if (type === 'image') {
                    content = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
                } else {
                    content = `<video src="${url}" style="width:100%; height:100%; object-fit:cover;"></video><i class="fas fa-play" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff; text-shadow:0 0 5px #000;"></i>`;
                }

                wrapper.innerHTML = `
                    ${content}
                    <input type="hidden" class="media-data" value="${url}" data-type="${type}" data-name="${file.name}">
                    <i class="fas fa-times-circle" style="position:absolute; top:2px; right:2px; color:red; background:#fff; border-radius:50%; cursor:pointer;" onclick="this.parentElement.remove()"></i>
                `;
                container.appendChild(wrapper);
            });
        },

        addLinkInput: function (previewId) {
            const url = prompt("Bağlantı adresini girin (https://...):");
            if (!url) return;

            const container = document.getElementById(previewId);
            const wrapper = document.createElement('div');
            wrapper.className = 'media-item';
            wrapper.style.cssText = 'position:relative; width:80px; height:80px; border:1px solid #ddd; border-radius:4px; display:flex; align-items:center; justify-content:center; background:#f9f9f9;';

            wrapper.innerHTML = `
                <i class="fas fa-link" style="font-size:2rem; color:var(--primary-color);"></i>
                <input type="hidden" class="media-data" value="${url}" data-type="link" data-name="${url}">
                <i class="fas fa-times-circle" style="position:absolute; top:2px; right:2px; color:red; background:#fff; border-radius:50%; cursor:pointer;" onclick="this.parentElement.remove()"></i>
             `;
            container.appendChild(wrapper);
        },

        collectMediaData: function (previewId) {
            const container = document.getElementById(previewId);
            if (!container) return [];
            return Array.from(container.querySelectorAll('.media-data')).map(input => ({
                url: input.value,
                type: input.getAttribute('data-type'),
                name: input.getAttribute('data-name')
            }));
        },

        renderMediaGallery: function (mediaList) {
            if (!mediaList || mediaList.length === 0) return '';

            let html = '<div class="media-gallery" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:10px; margin-top:1rem;">';
            mediaList.forEach(m => {
                if (m.type === 'image') {
                    html += `<div onclick="app.ui.openFileModal('${m.url}', 'image')" style="cursor:pointer; aspect-ratio:1; border-radius:8px; overflow:hidden; border:1px solid #ddd;"><img src="${m.url}" style="width:100%; height:100%; object-fit:cover;"></div>`;
                } else if (m.type === 'video') {
                    html += `<div onclick="app.ui.openFileModal('${m.url}', 'video')" style="cursor:pointer; aspect-ratio:1; border-radius:8px; overflow:hidden; border:1px solid #ddd; position:relative; background:#000;">
                        <video src="${m.url}" style="width:100%; height:100%; object-fit:cover; opacity:0.7;"></video>
                        <i class="fas fa-play-circle" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff; font-size:2rem;"></i>
                     </div>`;
                } else if (m.type === 'link') {
                    html += `<a href="${m.url}" target="_blank" style="aspect-ratio:1; border-radius:8px; border:1px solid #ddd; display:flex; flex-direction:column; align-items:center; justify-content:center; text-decoration:none; color:var(--text-dark); background:#f8fafc; padding:5px; text-align:center;">
                        <i class="fas fa-link" style="font-size:2rem; margin-bottom:5px; color:var(--secondary-color);"></i>
                        <span style="font-size:0.7rem; word-break:break-all; line-height:1.2;">${m.name}</span>
                    </a>`;
                }
            });
            html += '</div>';
            return html;
        },

        toggleTheme: function () {
            // Deprecated, use openSettingsModal
            this.openSettingsModal();
        },
        confirmModal: function () {
            // Logic to determine what to save
            if (document.getElementById('clientName')) {
                this.saveClient();
            } else if (document.getElementById('articleNumber')) {
                this.saveArticle();
            }
        },

        renderPage: function (page, params) {
            const contentArea = document.getElementById('contentArea');
            contentArea.innerHTML = '';

            switch (page) {
                case 'dashboard':
                    this.renderDashboard(contentArea);
                    break;
                case 'clients':
                    this.renderClients(contentArea);
                    break;
                case 'cases':
                    this.renderCases(contentArea);
                    break;
                case 'legislation':
                    this.renderLegislation(contentArea);
                    break;
                case 'legislation-detail':
                    this.renderLegislationDetail(contentArea, params);
                    break;
                case 'decisions':
                    this.renderDecisions(contentArea);
                    break;
                case 'decision-detail':
                    this.renderDecisionDetail(contentArea, params);
                    break;
                case 'petitions':
                    this.renderPetitions(contentArea);
                    break;
                case 'petition-detail':
                    this.renderPetitionDetail(contentArea, params);
                    break;
                case 'tools':
                    this.renderTools(contentArea);
                    break;
                case 'todos':
                    this.renderTodos(contentArea);
                    break;
                case 'finance':
                    this.renderFinance(contentArea);
                    break;
                case 'calendar':
                    this.renderCalendar(contentArea);
                    break;
                default:
                    contentArea.innerHTML = '<p>Sayfa bulunamadı.</p>';
            }
        },

        renderDashboard: function (container) {
            const recentActivity = app.state.activityLog.slice(0, 5);
            let activityHtml = '';

            if (recentActivity.length === 0) {
                activityHtml = '<li style="color:var(--text-secondary); padding:0.5rem 0;">Henüz işlem kaydı yok.</li>';
            } else {
                recentActivity.forEach(log => {
                    activityHtml += `
                    <li>
                        <div class="activity-info">
                            <h4>${log.text}</h4>
                        </div>
                        <div class="activity-time">${log.time}</div>
                    </li>
                    `;
                });
            }

            container.innerHTML = `
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="icon"><i class="fas fa-users"></i></div>
                        <div class="data">
                            <h3>Aktif Müvekkil</h3>
                            <p class="number" id="dashTotalClients">0</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="icon"><i class="fas fa-file-contract"></i></div>
                        <div class="data">
                            <h3>Açık Davalar</h3>
                            <p class="number" id="dashActiveCases">0</p>
                        </div>
                    </div>
                    <div class="stat-card urgent">
                        <div class="icon"><i class="fas fa-calendar-alt"></i></div>
                        <div class="data">
                            <h3>Yaklaşan Duruşma</h3>
                            <p class="number" id="upcomingHearingsCount">0</p> 
                        </div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:2rem; margin-bottom:2rem;">
                    <!-- Financial Chart -->
                    <div style="background:white; padding:1.5rem; border-radius:12px; border:1px solid #eee; box-shadow:var(--shadow-sm);">
                        <h3 style="margin-bottom:1rem; font-size:1rem; color:var(--text-secondary);">Gelir / Gider Analizi</h3>
                        <canvas id="financeChart"></canvas>
                    </div>

                    <!-- Case Distribution -->
                    <div style="background:white; padding:1.5rem; border-radius:12px; border:1px solid #eee; box-shadow:var(--shadow-sm);">
                        <h3 style="margin-bottom:1rem; font-size:1rem; color:var(--text-secondary);">Dava Dağılımı</h3>
                        <canvas id="caseDistChart"></canvas>
                    </div>

                    <!-- Case Status -->
                    <div style="background:white; padding:1.5rem; border-radius:12px; border:1px solid #eee; box-shadow:var(--shadow-sm);">
                        <h3 style="margin-bottom:1rem; font-size:1rem; color:var(--text-secondary);">Dosya Durumu</h3>
                        <canvas id="caseStatusChart"></canvas>
                    </div>
                </div>

                <div class="recent-activity-section">
                    <h2><i class="fas fa-history"></i> Son Hareketler</h2>
                    <ul class="activity-list">
                        ${activityHtml}
                    </ul>
                </div>
            `;
            app.updateDashboardStats();

            // --- init Charts ---
            setTimeout(() => {
                // Finance Data
                const income = (app.state.finance?.transactions || []).filter(t => t.type === 'income').reduce((a, b) => a + parseFloat(b.amount), 0);
                const expense = (app.state.finance?.transactions || []).filter(t => t.type === 'expense').reduce((a, b) => a + parseFloat(b.amount), 0);

                new Chart(document.getElementById('financeChart'), {
                    type: 'bar',
                    data: {
                        labels: ['Gelir', 'Gider'],
                        datasets: [{
                            label: 'Tutar (TL)',
                            data: [income, expense],
                            backgroundColor: ['#dcfce7', '#fee2e2'],
                            borderColor: ['#166534', '#991b1b'],
                            borderWidth: 1
                        }]
                    },
                    options: { responsive: true, scales: { y: { beginAtZero: true } } }
                });

                // Case Distribution
                const caseTypes = {};
                app.state.cases.forEach(c => { caseTypes[c.type] = (caseTypes[c.type] || 0) + 1; });

                new Chart(document.getElementById('caseDistChart'), {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(caseTypes).length ? Object.keys(caseTypes) : ['Veri Yok'],
                        datasets: [{
                            data: Object.keys(caseTypes).length ? Object.values(caseTypes) : [1],
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
                        }]
                    },
                    options: { responsive: true }
                });

                // Case Status
                const active = app.state.cases.filter(c => c.status === 'Açık').length;
                const closed = app.state.cases.filter(c => c.status === 'Kapalı').length;

                new Chart(document.getElementById('caseStatusChart'), {
                    type: 'pie',
                    data: {
                        labels: ['Açık', 'Kapalı'],
                        datasets: [{
                            data: [active, closed],
                            backgroundColor: ['#22c55e', '#ef4444']
                        }]
                    },
                    options: { responsive: true }
                });
            }, 100);
        },

        // --- CLIENTS ---
        renderClients: function (container) {
            let rows = '';
            app.state.clients.forEach(client => {
                const hasMedia = client.media && client.media.length > 0;
                let mediaHtml = '';

                if (hasMedia) {
                    const images = client.media.filter(m => m.type === 'image');
                    if (images.length > 0) {
                        // Show up to 3 thumbnails
                        images.slice(0, 3).forEach(img => {
                            mediaHtml += `<img src="${img.url}" style="width:24px; height:24px; object-fit:cover; border-radius:4px; margin-left:4px; vertical-align:middle; border:1px solid #ddd;" title="Görüntüle">`;
                        });
                        if (images.length > 3) mediaHtml += `<span style="font-size:0.8rem; color:var(--text-secondary); margin-left:2px;">+${images.length - 3}</span>`;
                    }

                    // If no images but has files, show paperclip
                    if (images.length === 0) {
                        mediaHtml = '<i class="fas fa-paperclip" title="Dosya Var" style="margin-left:5px; color:var(--text-secondary);"></i>';
                    }
                }

                rows += `
                    <tr>
                        <td data-label="Ad Soyad" style="display:flex; align-items:center;">
                            ${client.name}
                            <div style="display:inline-flex; align-items:center; margin-left:8px;">${mediaHtml}</div>
                        </td>
                        <td data-label="Telefon">${client.phone}</td>
                        <td data-label="E-posta">${client.email}</td>
                        <td data-label="Durum"><span class="status-badge ${client.status.toLowerCase()}">${client.status}</span></td>
                        <td data-label="İşlemler">
                            <button class="btn secondary small" style="margin-right:0.5rem;" onclick="app.ui.editClient('${client.id}')" title="Düzenle"><i class="fas fa-edit"></i></button>
                            <button class="btn secondary small" style="color:var(--danger-color); border-color:var(--danger-color);" onclick="app.ui.deleteClient('${client.id}')" title="Sil"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
            // ... (rest of renderClients container)
            container.innerHTML = `
                <div class="page-actions" style="margin-bottom: 1rem; display: flex; justify-content: flex-end;">
                    <button class="btn primary" onclick="app.ui.showClientModal()"><i class="fas fa-plus"></i> Yeni Müvekkil</button>
                </div>
                <div class="table-container" style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Ad Soyad</th>
                                <th>Telefon</th>
                                <th>E-posta</th>
                                <th>Durum</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody id="clientsTableBody">
                            ${rows}
                        </tbody>
                    </table>
                </div>
            `;
        },

        // ... (deleteClient, editClient, showClientModal, saveClient) ...
        // I need to skip valid code to reach renderDecisions if I want to do it in one go, but replace_file_content handles contiguous blocks.
        // It's safer to do separately or use multi-replace. I'll stick to one function per call if they are far apart.
        // renderClients ends around line 482. renderDecisions is around 1274. They are too far.
        // I will just update renderClients here.


        deleteClient: function (id) {
            if (confirm("Bu müvekkili silmek istediğinize emin misiniz?")) {
                app.state.clients = app.state.clients.filter(c => c.id !== id);
                app.saveData();
                this.renderClients(document.getElementById('contentArea'));
                app.updateDashboardStats();
            }
        },

        editClient: function (id) {
            this.showClientModal(id);
        },

        showClientModal: function (clientId = null) {
            app.state.editingClientId = clientId;
            const isEdit = !!clientId;

            let client = { name: '', phone: '', email: '', status: 'Aktif', notes: '', media: [] };
            if (isEdit) {
                const found = app.state.clients.find(c => c.id === clientId);
                if (found) client = found;
            }

            const mediaInputs = this.getMediaInputHtml('client');

            this.openModal(isEdit ? 'Müvekkili Düzenle' : 'Yeni Müvekkil Ekle', `
                <div class="form-group">
                    <label>Ad Soyad</label>
                    <input type="text" id="clientName" value="${client.name}">
                </div>
                <div class="form-group">
                    <label>Telefon</label>
                    <input type="tel" id="clientPhone" value="${client.phone}">
                </div>
                <div class="form-group">
                    <label>E-posta</label>
                    <input type="email" id="clientEmail" value="${client.email}">
                </div>
                <div class="form-group">
                    <label>Durum</label>
                    <select id="clientStatus">
                        <option value="Aktif" ${client.status === 'Aktif' ? 'selected' : ''}>Aktif</option>
                        <option value="Pasif" ${client.status === 'Pasif' ? 'selected' : ''}>Pasif</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Notlar</label>
                    <textarea id="clientNotes">${client.notes}</textarea>
                </div>
                ${mediaInputs}
            `, () => app.ui.saveClient());

            // Re-populate preview if editing
            if (client.media && client.media.length > 0) {
                const container = document.getElementById('clientPreview');
                if (container) {
                    client.media.forEach(m => {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'media-item';
                        wrapper.style.cssText = 'position:relative; width:80px; height:80px; border:1px solid #ddd; border-radius:4px; overflow:hidden;';
                        let content = '';
                        if (m.type === 'image') content = `<img src="${m.url}" style="width:100%; height:100%; object-fit:cover;">`;
                        else if (m.type === 'video') content = `<video src="${m.url}" style="width:100%; height:100%; object-fit:cover;"></video>`;
                        else content = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f9f9f9;"><i class="fas fa-link"></i></div>`;

                        wrapper.innerHTML = `
                            ${content}
                            <input type="hidden" class="media-data" value="${m.url}" data-type="${m.type}" data-name="${m.name}">
                            <i class="fas fa-times-circle" style="position:absolute; top:2px; right:2px; color:red; background:#fff; border-radius:50%; cursor:pointer;" onclick="this.parentElement.remove()"></i>
                        `;
                        container.appendChild(wrapper);
                    });
                }
            }
        },

        saveClient: function () {
            const name = document.getElementById('clientName').value;
            const phone = document.getElementById('clientPhone').value;
            const email = document.getElementById('clientEmail').value;
            const status = document.getElementById('clientStatus').value;
            const notes = document.getElementById('clientNotes').value;
            const media = this.collectMediaData('clientPreview');

            if (!name) {
                alert("Müvekkil adı zorunludur.");
                return;
            }

            if (app.state.editingClientId) {
                const client = app.state.clients.find(c => c.id === app.state.editingClientId);
                if (client) {
                    client.name = name;
                    client.phone = phone;
                    client.email = email;
                    client.status = status;
                    client.notes = notes;
                    // Append new media to existing or just replace? Let's treat collected as the full new list for simplicity in this edit flow.
                    // But wait, collectMediaData gets what's in DOM. If I re-populated DOM, it has everything.
                    client.media = media;
                }
            } else {
                const newClient = {
                    id: Date.now().toString(),
                    name, phone, email, status, notes, media
                };
                app.state.clients.push(newClient);
            }

            app.saveData();
            app.state.activityLog.unshift({ text: `Müvekkil ${app.state.editingClientId ? 'güncellendi' : 'eklendi'}: ${name}`, time: new Date().toLocaleTimeString() });
            this.closeModal();
            this.renderClients(document.getElementById('contentArea'));
            app.updateDashboardStats();
        },

        // --- CASES ---
        renderCases: function (container) {
            let rows = '';
            app.state.cases.forEach(kase => {
                const client = app.state.clients.find(c => c.id === kase.clientId);
                const clientName = client ? client.name : 'Bilinmiyor';

                const hasMedia = kase.media && kase.media.length > 0;
                let mediaHtml = '';

                if (hasMedia) {
                    const images = kase.media.filter(m => m.type === 'image');
                    if (images.length > 0) {
                        images.slice(0, 3).forEach(img => {
                            mediaHtml += `<img src="${img.url}" style="width:24px; height:24px; object-fit:cover; border-radius:4px; margin-left:4px; vertical-align:middle; border:1px solid #ddd;" title="Görüntüle">`;
                        });
                        if (images.length > 3) mediaHtml += `<span style="font-size:0.8rem; color:var(--text-secondary); margin-left:2px;">+${images.length - 3}</span>`;
                    } else {
                        mediaHtml = '<i class="fas fa-paperclip" title="Dosya Var" style="margin-left:5px; color:var(--text-secondary);"></i>';
                    }
                }

                rows += `
                    <tr>
                        <td data-label="Konu">
                            <strong>${kase.title}</strong>
                            <div style="display:inline-flex; align-items:center; margin-left:8px;">${mediaHtml}</div>
                            <br><small style="color:var(--text-secondary)">${kase.court}</small>
                        </td>
                        <td data-label="Müvekkil">${clientName}</td>
                        <td data-label="Tür">${kase.type}</td>
                        <td data-label="Tarih">${kase.nextHearing || '-'}</td>
                        <td data-label="Durum"><span class="status-badge ${kase.status === 'Açık' ? 'aktif' : 'kapalı'}">${kase.status}</span></td>
                        <td data-label="İşlemler">
                            <button class="btn secondary small" style="margin-right:0.5rem;" onclick="app.ui.editCase(${kase.id})" title="Düzenle"><i class="fas fa-edit"></i></button>
                            <button class="btn secondary small" style="color:var(--danger-color); border-color:var(--danger-color);" onclick="app.ui.deleteCase(${kase.id})" title="Sil"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });

            container.innerHTML = `
                <div class="page-actions" style="margin-bottom: 1rem; display: flex; justify-content: flex-end;">
                    <button class="btn primary" onclick="app.ui.showCaseModal('Yeni Dava Ekle')"><i class="fas fa-plus"></i> Yeni Dava</button>
                </div>
                <div class="table-container" style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Dava Konusu</th>
                                <th>Müvekkil</th>
                                <th>Tür</th>
                                <th>Duruşma Tarihi</th>
                                <th>Durum</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            `;
        },

        deleteCase: function (id) {
            if (confirm("Bu davayı silmek istediğinize emin misiniz?")) {
                app.state.cases = app.state.cases.filter(c => c.id !== id);
                app.saveData();
                this.renderCases(document.getElementById('contentArea'));
                app.updateDashboardStats();
            }
        },

        editCase: function (id) {
            const kase = app.state.cases.find(c => c.id === id);
            if (!kase) return;
            app.state.editingCaseId = id;
            this.showCaseModal('Dava Düzenle', kase);
        },

        showCaseModal: function (title, caseData = null) {
            const elTitle = document.getElementById('modalTitle');
            const elOverlay = document.getElementById('modalOverlay');
            const elBody = document.getElementById('modalBody');

            if (elTitle) elTitle.textContent = title;
            if (elOverlay) elOverlay.classList.remove('hidden');

            if (!caseData) {
                app.state.editingCaseId = null;
                caseData = { title: '', type: '', court: '', status: 'Açık', nextHearing: '', clientId: '' };
            }

            // Client options
            let clientOptions = '<option value="">Seçiniz</option>';
            app.state.clients.forEach(c => {
                const selected = c.id == caseData.clientId ? 'selected' : '';
                clientOptions += `<option value="${c.id}" ${selected}>${c.name}</option>`;
            });

            const mediaInputs = this.getMediaInputHtml('case');

            this.openModal(title, `
                    <div class="form-group">
                        <label>Dava Konusu</label>
                        <input type="text" id="caseTitle" value="${caseData.title}" placeholder="Örn: Boşanma Davası">
                    </div>
                    <div class="form-group">
                        <label>Müvekkil</label>
                        <select id="caseClient">${clientOptions}</select>
                    </div>
                     <div class="form-group">
                        <label>Mahkeme</label>
                        <input type="text" id="caseCourt" value="${caseData.court}" placeholder="Örn: 2. Aile Mahkemesi">
                    </div>
                     <div class="form-group">
                        <label>Tür</label>
                        <input type="text" id="caseType" value="${caseData.type}" placeholder="Örn: Aile Hukuku">
                    </div>
                    <div class="form-group">
                        <label>Duruşma Tarihi</label>
                        <input type="date" id="caseDate" value="${caseData.nextHearing || ''}">
                    </div>
                    <div class="form-group">
                        <label>Durum</label>
                        <select id="caseStatus">
                            <option ${caseData.status === 'Açık' ? 'selected' : ''}>Açık</option>
                            <option ${caseData.status === 'Kapalı' ? 'selected' : ''}>Kapalı</option>
                            <option ${caseData.status === 'Beklemede' ? 'selected' : ''}>Beklemede</option>
                        </select>
                    </div>
                    ${mediaInputs}
            `, () => this.saveCase());

            // Re-populate preview if editing
            if (caseData.media && caseData.media.length > 0) {
                setTimeout(() => {
                    const container = document.getElementById('casePreview');
                    if (container) {
                        caseData.media.forEach(m => {
                            const wrapper = document.createElement('div');
                            wrapper.className = 'media-item';
                            wrapper.style.cssText = 'position:relative; width:80px; height:80px; border:1px solid #ddd; border-radius:4px; overflow:hidden;';
                            let content = '';
                            if (m.type === 'image') content = `<img src="${m.url}" style="width:100%; height:100%; object-fit:cover;">`;
                            else if (m.type === 'video') content = `<video src="${m.url}" style="width:100%; height:100%; object-fit:cover;"></video>`;
                            else content = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f9f9f9;"><i class="fas fa-link"></i></div>`;

                            wrapper.innerHTML = `
                                ${content}
                                <input type="hidden" class="media-data" value="${m.url}" data-type="${m.type}" data-name="${m.name}">
                                <i class="fas fa-times-circle" style="position:absolute; top:2px; right:2px; color:red; background:#fff; border-radius:50%; cursor:pointer;" onclick="this.parentElement.remove()"></i>
                            `;
                            container.appendChild(wrapper);
                        });
                    }
                }, 0);
            }
        },

        saveCase: function () {
            const title = document.getElementById('caseTitle').value;
            const clientId = document.getElementById('caseClient').value;
            const court = document.getElementById('caseCourt').value;
            const type = document.getElementById('caseType').value;
            const date = document.getElementById('caseDate').value;
            const status = document.getElementById('caseStatus').value;

            const media = this.collectMediaData('casePreview');

            if (!title) { alert("Dava konusu zorunludur."); return; }

            if (app.state.editingCaseId) {
                const kase = app.state.cases.find(c => c.id === app.state.editingCaseId);
                if (kase) {
                    kase.title = title;
                    kase.clientId = parseInt(clientId);
                    kase.court = court;
                    kase.type = type;
                    kase.nextHearing = date;
                    kase.status = status;
                }
            } else {
                const newId = app.state.cases.length > 0 ? Math.max(...app.state.cases.map(c => c.id)) + 1 : 201;
                app.state.cases.push({
                    id: newId,
                    clientId: parseInt(clientId),
                    title: title,
                    court: court,
                    type: type,
                    nextHearing: date,
                    status: status,
                    notes: '',
                    media: media
                });
            }

            app.saveData();
            this.closeModal();
            if (app.state.currentPage === 'cases') {
                this.renderCases(document.getElementById('contentArea'));
            }
            app.updateDashboardStats();
        },

        // --- LEGISLATION ---
        renderLegislation: function (container) {
            let lawCards = '';
            const laws = app.state.legislation;

            laws.forEach(law => {
                lawCards += `
                    <div class="law-card" style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 0.5rem; transition: transform 0.2s; position: relative;">
                        <div style="cursor: pointer;" onclick="app.router.navigate('legislation-detail', ${law.id})">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">${law.code}</span>
                                <small style="color: var(--text-secondary);">Kanun No: ${law.number}</small>
                            </div>
                            <h3 style="font-size: 1.1rem; color: var(--text-dark); margin: 0.5rem 0;">${law.name}</h3>
                            <p style="font-size: 0.9rem; color: var(--text-secondary); flex: 1;">${law.description}</p>
                        </div>
                         <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                            <button class="btn secondary small" style="flex:1;" onclick="app.router.navigate('legislation-detail', ${law.id})">İncele</button>
                            <button class="btn secondary small" onclick="app.ui.editLaw(${law.id})" title="Düzenle"><i class="fas fa-edit"></i></button>
                            <button class="btn secondary small" onclick="app.ui.deleteLaw(${law.id})" title="Sil" style="color:var(--danger-color);"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
    `;
            });

            container.innerHTML = `
                <div class="page-actions" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <div class="search-bar" style="flex: 1; margin-right: 1rem; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"></i>
                        <input type="text" placeholder="Kanun ara..." style="width: 100%; padding: 0.8rem 0.8rem 0.8rem 2.5rem; border-radius: 8px; border: 1px solid var(--border-color);">
                    </div>
                    <button class="btn primary" onclick="app.ui.showLawModal('Yeni Kanun Ekle')"><i class="fas fa-plus"></i> Kanun Ekle</button>
                </div>
                <div class="laws-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${lawCards}
                </div>
            `;
        },

        deleteLaw: function (id) {
            if (confirm("Bu kanunu ve tüm maddelerini silmek istediğinize emin misiniz?")) {
                app.state.legislation = app.state.legislation.filter(l => l.id !== id);
                app.saveData();
                this.renderLegislation(document.getElementById('contentArea'));
            }
        },

        editLaw: function (id) {
            const law = app.state.legislation.find(l => l.id === id);
            if (!law) return;
            app.state.editingLawId = id;
            this.showLawModal('Kanun Düzenle', law);
        },

        showLawModal: function (title, lawData = null) {
            const elTitle = document.getElementById('modalTitle');
            const elOverlay = document.getElementById('modalOverlay');
            const elBody = document.getElementById('modalBody');

            if (elTitle) elTitle.textContent = title;
            if (elOverlay) elOverlay.classList.remove('hidden');

            if (!lawData) {
                app.state.editingLawId = null;
                lawData = { code: '', number: '', name: '', description: '' };
            }

            this.openModal(title, `
                <div class="form-group">
                    <label>Kanun Kodu/Kısaltması</label>
                    <input type="text" id="lawCode" value="${lawData.code}" placeholder="Örn: CMK">
                </div>
                 <div class="form-group">
                    <label>Kanun No</label>
                    <input type="text" id="lawNumber" value="${lawData.number}" placeholder="Örn: 5271">
                </div>
                <div class="form-group">
                    <label>Kanun Adı</label>
                    <input type="text" id="lawName" value="${lawData.name}" placeholder="Örn: Ceza Muhakemesi Kanunu">
                </div>
                 <div class="form-group">
                    <label>Açıklama</label>
                    <textarea id="lawDesc" rows="3">${lawData.description}</textarea>
                </div>
            `, () => this.saveLaw());
        },

        saveLaw: function () {
            const code = document.getElementById('lawCode').value;
            const number = document.getElementById('lawNumber').value;
            const name = document.getElementById('lawName').value;
            const desc = document.getElementById('lawDesc').value;

            if (!name) { alert("Kanun adı zorunludur."); return; }

            if (app.state.editingLawId) {
                const law = app.state.legislation.find(l => l.id === app.state.editingLawId);
                if (law) {
                    law.code = code;
                    law.number = number;
                    law.name = name;
                    law.description = desc;
                }
            } else {
                const newId = app.state.legislation.length > 0 ? Math.max(...app.state.legislation.map(l => l.id)) + 1 : 1;
                app.state.legislation.push({
                    id: newId,
                    code: code,
                    number: number,
                    name: name,
                    description: desc,
                    articles: []
                });
            }

            app.saveData();
            this.closeModal();
            this.renderLegislation(document.getElementById('contentArea'));
        },

        // --- ARTICLE & HIGHLIGHTS ---

        handleSelection: function (e) {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0 || selection.toString().length === 0) {
                // Do not remove immediately if clicking inside toolbar
                // handled by event bubbling checks typically, but simplified here
                return;
            }

            // If selection is inside article content
            if (!e.target.closest('.article-content-area')) return;

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            let toolbar = document.getElementById('highlightToolbar');
            if (toolbar) toolbar.remove(); // Always recreate to be safe

            toolbar = document.createElement('div');
            toolbar.id = 'highlightToolbar';
            toolbar.className = 'highlight-toolbar';
            toolbar.innerHTML = `
    < div class="color-btn" style="background:rgba(255,255,0,0.5);" onclick="app.ui.applyHighlight('highlight-yellow')" ></div >
    <div class="color-btn" style="background:rgba(0,255,0,0.5);" onclick="app.ui.applyHighlight('highlight-green')"></div>
    <div class="color-btn" style="background:rgba(0,255,255,0.5);" onclick="app.ui.applyHighlight('highlight-blue')"></div>
    <div class="color-btn" style="background:rgba(255,192,203,0.5);" onclick="app.ui.applyHighlight('highlight-pink')"></div>
    <div class="color-btn" style="background:#fff; border:1px solid #ccc; color:#333; display:flex; align-items:center; justify-content:center; font-size:10px;" onclick="app.ui.removeHighlight()">Sil</div>
    `;
            document.body.appendChild(toolbar);

            toolbar.style.top = `${rect.top + window.scrollY - 45} px`;
            toolbar.style.left = `${rect.left + window.scrollX} px`;
        },

        // Removed global click listener for toolbar removal to simplify; relying on action to remove.

        applyHighlight: function (className) {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);

            // Simple span wrap
            const span = document.createElement('span');
            span.className = className;

            try {
                range.surroundContents(span);
            } catch (e) {
                console.log("Cross-block selection not supported in this simple implementation");
                // For a robust implementation, we'd need to use a range library or recursive wrapping.
                // For MVP, alerting user or ignoring.
            }

            selection.removeAllRanges();
            const toolbar = document.getElementById('highlightToolbar');
            if (toolbar) toolbar.remove();

            this.saveArticleContentState();
        },

        removeHighlight: function () {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            // Check if start node is inside a highlight span
            let node = selection.anchorNode;
            if (node.nodeType === 3) node = node.parentNode; // Get text parent

            if (node.tagName === 'SPAN' && node.className.includes('highlight-')) {
                // Unwrap
                const parent = node.parentNode;
                while (node.firstChild) parent.insertBefore(node.firstChild, node);
                parent.removeChild(node);
            }

            selection.removeAllRanges();
            document.getElementById('highlightToolbar').remove();
            this.saveArticleContentState();
        },

        saveArticleContentState: function () {
            const articlesList = document.querySelector('.articles-list');
            if (!articlesList) return;

            const law = app.state.legislation.find(l => l.id === app.state.currentLawId);
            if (!law) return;

            const articleItems = articlesList.querySelectorAll('.article-item');
            articleItems.forEach(item => {
                const id = item.getAttribute('data-id');
                const contentDiv = item.querySelector('.article-content-area');
                if (id && contentDiv) {
                    const article = law.articles.find(a => a.id == id);
                    if (article) {
                        if (article.content !== contentDiv.innerHTML) {
                            article.content = contentDiv.innerHTML;
                        }
                    }
                }
            });
            app.saveData();
        },

        clearAllHighlights: function () {
            if (!confirm("Bu sayfadaki tüm vurgulamaları temizlemek istiyor musunuz?")) return;

            const articlesList = document.querySelector('.articles-list');
            if (!articlesList) return;

            // Strip spans
            const spans = articlesList.querySelectorAll('span[class^="highlight-"]');
            spans.forEach(span => {
                const parent = span.parentNode;
                while (span.firstChild) parent.insertBefore(span.firstChild, span);
                parent.removeChild(span);
            });

            this.saveArticleContentState();
        },

        addLawDocument: function (input) {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const law = app.state.legislation.find(l => l.id === app.state.currentLawId);
                if (law) {
                    if (!law.documents) law.documents = [];
                    law.documents.push({
                        name: file.name,
                        date: new Date().toLocaleDateString(),
                        // In real app, we'd upload. Here we fake it or use objectURL temporarily (won't persist well)
                        // For persistent mock, we just use name.
                        url: URL.createObjectURL(file)
                    });
                    app.saveData();
                    this.renderLegislationDetail(document.getElementById('contentArea'), app.state.currentLawId);
                }
            }
        },

        deleteLawDocument: function (index) {
            const law = app.state.legislation.find(l => l.id === app.state.currentLawId);
            if (law && law.documents) {
                law.documents.splice(index, 1);
                app.saveData();
                this.renderLegislationDetail(document.getElementById('contentArea'), app.state.currentLawId);
            }
        },

        openLawDocument: function (url, name) {
            document.getElementById('fileModal').classList.remove('hidden');
            // If it's a blob URL it works, if it's just a string name from persistence, we can't really open it.
            // We'll try to visually communicate this.
            if (url.startsWith('blob:')) {
                document.getElementById('fileViewer').src = url;
            } else {
                alert("Bu bir simülasyon olduğu için tarayıcı belleğindeki dosyalar sayfa yenilendiğinde kaybolur. Lütfen yeni bir dosya seçin.");
            }
        },

        renderLegislationDetail: function (container, lawId) {
            app.state.currentLawId = lawId;
            const law = app.state.legislation.find(l => l.id === lawId);
            if (!law) {
                container.innerHTML = '<p>Kanun bulunamadı.</p>';
                return;
            }

            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) pageTitle.textContent = `${law.code} - ${law.name} `;

            // --- DOCS SECTION ---
            let docsHtml = '';
            if (law.documents && law.documents.length > 0) {
                docsHtml = `<div class="law-documents-area" style="margin-bottom:2rem; overflow-x:auto; display:flex; gap:1rem; padding-bottom:10px;">`;
                law.documents.forEach((doc, idx) => {
                    docsHtml += `
                        <div class="doc-card" style="min-width:120px; background:var(--bg-main); border:1px solid var(--border-color); padding:1rem; border-radius:8px; text-align:center; position:relative;">
                            <i class="fas fa-times-circle" style="position:absolute; top:5px; right:5px; cursor:pointer; color:var(--danger-color);" onclick="app.ui.deleteLawDocument(${idx})"></i>
                            <div onclick="app.ui.openLawDocument('${doc.url}', '${doc.name}')" style="cursor:pointer;">
                                <i class="fas fa-file-pdf" style="font-size:2rem; color:#e11d48; margin-bottom:0.5rem;"></i>
                                <div style="font-size:0.8rem; word-break:break-word;">${doc.name}</div>
                            </div>
                        </div>
                    `;
                });
                docsHtml += `</div>`;
            }

            let headerHtml = '';
            if (law.details) {
                headerHtml = `
                    <div class="official-header" style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #ccc; padding-bottom: 1rem;">
                        <h4 style="color: #c00; font-family: 'Times New Roman', serif; font-weight: bold; margin-bottom: 0.5rem;">${law.details.header.title || ''}</h4>
                        <h3 style="font-family: 'Times New Roman', serif; font-weight: bold; margin-bottom: 0.5rem;">${law.details.header.subtitle || ''}</h3>
                        
                        <div style="background: #f8f8f8; padding: 10px; border: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; margin: 1rem 0; font-family: 'Times New Roman', serif; font-size: 0.9rem;">
                            <span><strong>Resmî Gazete Tarihi:</strong> ${law.details.meta.date}</span>
                            <span><strong>Resmî Gazete Sayısı:</strong> ${law.details.meta.number}</span>
                            <div>
                                <button class="btn secondary small" onclick="window.print()"><i class="fas fa-print"></i> Yazdır/PDF</button>
                            </div>
                        </div>
                    </div>
                `;
            }

            // ... (Article Rendering)
            let articlesHtml = '';
            if (law.articles && law.articles.length > 0) {
                const sortedArticles = [...law.articles].sort((a, b) => parseInt(a.number) - parseInt(b.number));
                sortedArticles.forEach(article => {
                    const attachmentHtml = article.attachment ? `
                        <div style="margin-top:10px; padding:10px; background:var(--bg-main); border-radius:4px; display:flex; align-items:center;">
                            <i class="fas fa-file-pdf" style="color:red; margin-right:10px; font-size:1.2rem;"></i>
                            <span style="flex:1;">${article.attachment}</span>
                            <small class="status-badge">Ekli</small>
                        </div>
                    ` : '';

                    const mediaGalleryHtml = article.media ? app.ui.renderMediaGallery(article.media) : '';

                    articlesHtml += `
                        <div class="article-item" data-id="${article.id}" style="border-bottom: 1px solid var(--border-color); padding: 1.5rem 0; position: relative;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <h4 style="color: var(--primary-color); margin-bottom: 0.5rem; font-family: 'Playfair Display', serif;">Madde ${article.number} - ${article.title}</h4>
                                <div class="article-actions">
                                    <button class="btn secondary small" onclick="app.ui.shareArticle('Madde ${article.number} - ${article.title}', '${article.content.replace(/'/g, "\\'")}')" title="WhatsApp Paylaş"><i class="fab fa-whatsapp"></i></button>
                                    <button class="btn secondary small" onclick="app.ui.editArticle('${article.id}')" title="Düzenle"><i class="fas fa-edit"></i></button>
                                    <button class="btn secondary small" style="color:var(--danger-color); border-color:var(--danger-color);" onclick="app.ui.deleteArticle('${article.id}')" title="Sil"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                            <div class="article-content-area" style="padding:10px; border-radius:4px; transition:background 0.2s;" onmouseup="app.ui.handleSelection(event)">${article.content}</div>
                            ${attachmentHtml}
                            ${mediaGalleryHtml}
                        </div>
                    `;
                });
            } else {
                articlesHtml = '<p style="padding: 1rem; color: var(--text-secondary);">Bu kanun için henüz madde içeriği eklenmemiştir.</p>';
            }

            // Footer HTML is same
            let footerHtml = '';
            if (law.details) {
                footerHtml = `
                    <div class="official-footer" style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ddd; font-size: 0.8rem; color: #666; text-align: center;">
                        <img src="https://www.mevzuat.gov.tr/assets/images/cb_logo.png" style="height: 40px; margin-bottom: 0.5rem; opacity: 0.8;" alt="Logo"/>
                        <p><strong>${law.details.header.ministry}</strong></p>
                        <p>${law.details.footer.address}</p>
                        <p>${law.details.footer.copyright}</p>
                    </div>
                `;
            }

            container.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-md);">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 1rem; align-items:center;">
                        <button onclick="app.router.navigate('legislation')" class="btn secondary small"><i class="fas fa-arrow-left"></i> Mevzuata Dön</button>

                        <div style="display:flex; gap:0.5rem;">
                            <input type="file" id="lawDocInput" hidden accept=".pdf" onchange="app.ui.addLawDocument(this)">
                            <button class="btn secondary small" onclick="document.getElementById('lawDocInput').click()"><i class="fas fa-file-pdf"></i> PDF Ekle</button>
                            <button class="btn secondary small" onclick="app.ui.clearAllHighlights()"><i class="fas fa-eraser"></i> Vurguları Temizle</button>
                            <button class="btn primary small" onclick="app.ui.showArticleModal('Madde Ekle')"><i class="fas fa-plus"></i> Madde Ekle</button>
                        </div>
                    </div>
                     
                    ${docsHtml}
                    ${headerHtml}

                    <div class="articles-list">
                        ${articlesHtml}
                    </div>
                    ${footerHtml}
                </div>
            `;

            // Bind Highlighter
            const articleArea = container.querySelector('.articles-list');
            if (articleArea) {
                articleArea.addEventListener('mouseup', (e) => this.handleSelection(e));
            }
        },

        // --- HIGHLIGHTER ---
        handleSelection: function (e) {
            const selection = window.getSelection();
            if (selection.toString().length > 0) {
                // Ensure selection is within article list
                if (!e.target.closest('.articles-list')) return;

                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                this.showHighlightToolbar(rect.left, rect.top + window.scrollY - 40, range);
            } else {
                const toolbar = document.getElementById('highlightToolbar');
                if (toolbar) toolbar.remove();
            }
        },

        showHighlightToolbar: function (x, y, range) {
            let toolbar = document.getElementById('highlightToolbar');
            if (toolbar) toolbar.remove();

            toolbar = document.createElement('div');
            toolbar.id = 'highlightToolbar';
            toolbar.className = 'highlight-toolbar';
            toolbar.style.left = x + 'px';
            toolbar.style.top = y + 'px';

            // Colors: Yellow, Green, Blue, Pink
            const colors = [
                { class: 'highlight-yellow', color: '#fef08a' },
                { class: 'highlight-green', color: '#bbf7d0' },
                { class: 'highlight-blue', color: '#bfdbfe' },
                { class: 'highlight-pink', color: '#fbcfe8' }
            ];

            colors.forEach(c => {
                const btn = document.createElement('div');
                btn.className = 'color-btn';
                btn.style.backgroundColor = c.color;
                btn.onmousedown = (e) => {
                    e.preventDefault(); // Prevent losing selection
                    this.applyHighlight(c.class, range);
                };
                toolbar.appendChild(btn);
            });

            // Close
            const closeBtn = document.createElement('div');
            closeBtn.className = 'color-btn';
            closeBtn.style.background = '#fff';
            closeBtn.style.display = 'flex';
            closeBtn.style.alignItems = 'center';
            closeBtn.style.justifyContent = 'center';
            closeBtn.innerHTML = '<i class="fas fa-times" style="font-size:12px;"></i>';
            closeBtn.onmousedown = (e) => { e.preventDefault(); toolbar.remove(); };
            toolbar.appendChild(closeBtn);

            document.body.appendChild(toolbar);
        },

        applyHighlight: function (className, range) {
            const span = document.createElement('span');
            span.className = className;
            try {
                range.surroundContents(span);
            } catch (e) {
                alert("Karmaşık seçimler (farklı bloklar arası) vurgulanamaz.");
            }
            window.getSelection().removeAllRanges();
            const toolbar = document.getElementById('highlightToolbar');
            if (toolbar) toolbar.remove();
            this.saveArticleContentState();
        },

        clearAllHighlights: function () {
            if (confirm('Bu sayfadaki tüm vurgulamaları temizlemek istiyor musunuz?')) {
                this.renderLegislationDetail(document.getElementById('contentArea'), app.state.currentLawId);
            }
        },

        // --- YARGITAY KARARLARI ---
        renderDecisions: function (container) {
            const decisions = app.state.decisions || [];

            let listHtml = '';
            if (decisions.length === 0) {
                listHtml = `
                    <tr>
                        <td colspan="4" style="text-align:center; padding:2rem; color:var(--text-secondary);">
                            Henüz kayıtlı Yargıtay kararı yok.
                        </td>
                    </tr>
                `;
            } else {
                decisions.forEach(d => {
                    const hasMedia = d.media && d.media.length > 0;
                    let mediaHtml = '';

                    if (hasMedia) {
                        const images = d.media.filter(m => m.type === 'image');
                        if (images.length > 0) {
                            images.slice(0, 3).forEach(img => {
                                mediaHtml += `<img src="${img.url}" style="width:24px; height:24px; object-fit:cover; border-radius:4px; margin-left:4px; vertical-align:middle; border:1px solid #ddd;" title="Görüntüle">`;
                            });
                            if (images.length > 3) mediaHtml += `<span style="font-size:0.8rem; color:var(--text-secondary); margin-left:2px;">+${images.length - 3}</span>`;
                        } else {
                            mediaHtml = '<i class="fas fa-paperclip" title="Dosya Var" style="margin-left:5px; color:var(--text-secondary);"></i>';
                        }
                    }

                    listHtml += `
                        <tr onclick="app.router.navigate('decision-detail', '${d.id}')" style="cursor:pointer;">
                            <td><strong>${d.daire}</strong></td>
                            <td>${d.esasNo} / ${d.kararNo}</td>
                            <td>${d.tarih}</td>
                            <td>
                                <span class="badge" style="background:${d.konu ? '#e0f2fe' : '#f3f4f6'}; color:${d.konu ? '#0369a1' : '#374151'}">${d.konu || 'Genel'}</span>
                                ${mediaHtml}
                            </td>
                        </tr>
                    `;
                });
            }

            container.innerHTML = `
                <div class="section-header">
                     <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Esas No, Karar No veya Konu ara..." onkeyup="app.ui.filterDecisions(this.value)">
                    </div>
                    <button class="btn primary" onclick="app.ui.showDecisionModal()"><i class="fas fa-plus"></i> Karar Ekle</button>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Daire</th>
                                <th>Esas / Karar No</th>
                                <th>Tarih</th>
                                <th>Konu</th>
                            </tr>
                        </thead>
                        <tbody id="decisionsTableBody">
                            ${listHtml}
                        </tbody>
                    </table>
                </div>
            `;
        },

        filterDecisions: function (query) {
            const rows = document.querySelectorAll('#decisionsTableBody tr');
            const term = query.toLowerCase();
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        },

        showDecisionModal: function (decisionId = null) {
            app.state.editingDecisionId = decisionId;
            const isEdit = !!decisionId;
            let data = { daire: '', esasNo: '', kararNo: '', tarih: '', konu: '', ozet: '', icerik: '', media: [] };

            if (isEdit) {
                const existing = app.state.decisions.find(d => d.id === decisionId);
                if (existing) data = existing;
            }

            const mediaInputs = this.getMediaInputHtml('decision');

            this.openModal(isEdit ? 'Kararı Düzenle' : 'Yeni Karar Ekle', `
                <div class="form-group">
                    <label>Daire</label>
                    <input type="text" id="decDaire" value="${data.daire}" placeholder="Örn: 12. Hukuk Dairesi">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Esas No</label>
                        <input type="text" id="decEsas" value="${data.esasNo}" placeholder="2023/123">
                    </div>
                    <div class="form-group">
                        <label>Karar No</label>
                        <input type="text" id="decKarar" value="${data.kararNo}" placeholder="2024/45">
                    </div>
                </div>
                <div class="form-row">
                     <div class="form-group">
                        <label>Tarih</label>
                        <input type="date" id="decTarih" value="${data.tarih}">
                    </div>
                    <div class="form-group">
                        <label>Konu</label>
                        <input type="text" id="decKonu" value="${data.konu}" placeholder="Örn: Tahliye Taahhütnamesi">
                    </div>
                </div>
                <div class="form-group">
                    <label>Özet</label>
                    <textarea id="decOzet" rows="2">${data.ozet}</textarea>
                </div>
                <div class="form-group">
                    <label>Tam Metin</label>
                    <textarea id="decIcerik" rows="8">${data.icerik}</textarea>
                </div>
                ${mediaInputs}
`, () => app.ui.saveDecision());

            // Re-populate preview if editing (visual only, real data is in hidden inputs if we were fully re-hydrating, 
            // but for simplicity we just rely on saving new ones or keeping old ones in background)
            if (data.media && data.media.length > 0) {
                const container = document.getElementById('decisionPreview');
                if (container) {
                    data.media.forEach(m => {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'media-item';
                        wrapper.style.cssText = 'position:relative; width:80px; height:80px; border:1px solid #ddd; border-radius:4px; overflow:hidden;';
                        let content = '';
                        if (m.type === 'image') content = `<img src="${m.url}" style="width:100%; height:100%; object-fit:cover;">`;
                        else if (m.type === 'video') content = `<video src="${m.url}" style="width:100%; height:100%; object-fit:cover;"></video>`;
                        else content = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f9f9f9;"><i class="fas fa-link"></i></div>`;

                        wrapper.innerHTML = `
                            ${content}
<input type="hidden" class="media-data" value="${m.url}" data-type="${m.type}" data-name="${m.name}">
    <i class="fas fa-times-circle" style="position:absolute; top:2px; right:2px; color:red; background:#fff; border-radius:50%; cursor:pointer;" onclick="this.parentElement.remove()"></i>
    `;
                        container.appendChild(wrapper);
                    });
                }
            }
        },

        saveDecision: function () {
            const daire = document.getElementById('decDaire').value;
            const esas = document.getElementById('decEsas').value;
            const karar = document.getElementById('decKarar').value;
            const tarih = document.getElementById('decTarih').value;
            const konu = document.getElementById('decKonu').value;
            const ozet = document.getElementById('decOzet').value;
            const icerik = document.getElementById('decIcerik').value;

            const media = this.collectMediaData('decisionPreview');

            if (!daire || !esas || !karar) {
                alert("Lütfen Daire, Esas ve Karar numaralarını giriniz.");
                return;
            }

            const decisionData = {
                id: app.state.editingDecisionId || Date.now().toString(),
                daire, esasNo: esas, kararNo: karar, tarih, konu, ozet, icerik, media
            };

            if (app.state.editingDecisionId) {
                const idx = app.state.decisions.findIndex(d => d.id === app.state.editingDecisionId);
                if (idx > -1) app.state.decisions[idx] = decisionData;
            } else {
                app.state.decisions.push(decisionData);
            }

            app.saveData();
            app.state.activityLog.unshift({ text: `Yargıtay kararı ${app.state.editingDecisionId ? 'güncellendi' : 'eklendi'}: ${esas}/${karar}`, time: new Date().toLocaleTimeString() });

            this.closeModal();
            if (app.state.currentPage === 'decision-detail' && app.state.editingDecisionId === app.state.currentPageParams) {
                this.renderDecisionDetail(document.getElementById('contentArea'), decisionData.id);
            } else {
                this.renderDecisions(document.getElementById('contentArea'));
            }
        },

        deleteDecision: function (id) {
            if (confirm("Bu kararı silmek istediğinize emin misiniz?")) {
                app.state.decisions = app.state.decisions.filter(d => d.id !== id);
                app.saveData();
                app.router.navigate('decisions');
            }
        },

        renderDecisionDetail: function (container, id) {
            const decision = app.state.decisions.find(d => d.id === id);
            if (!decision) {
                container.innerHTML = 'Karar bulunamadı.';
                return;
            }

            const mediaGallery = this.renderMediaGallery(decision.media);

            container.innerHTML = `
    <div style="background:white; padding:2rem; border-radius:12px; box-shadow:var(--shadow-md);">
        <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem; border-bottom:1px solid #eee; padding-bottom:1rem;">
            <button class="btn secondary small" onclick="app.router.navigate('decisions')"><i class="fas fa-arrow-left"></i> Listeye Dön</button>
            <div>
                <button class="btn secondary small" onclick="app.ui.showDecisionModal('${decision.id}')"><i class="fas fa-edit"></i> Düzenle</button>
                <button class="btn secondary small" style="color:red;" onclick="app.ui.deleteDecision('${decision.id}')"><i class="fas fa-trash"></i> Sil</button>
            </div>
        </div>

        <div style="text-align:center; margin-bottom:2rem;">
            <h2 style="color:var(--primary-color);font-family:'Times New Roman', serif;">T.C. YARGITAY</h2>
            <h3 style="margin:0.5rem 0;">${decision.daire}</h3>
            <p><strong>Esas No:</strong> ${decision.esasNo} | <strong>Karar No:</strong> ${decision.kararNo} | <strong>Tarih:</strong> ${decision.tarih}</p>
        </div>

        ${mediaGallery}

        <div style="background:#f8fafc; padding:1.5rem; border-left:4px solid var(--accent-color); margin-bottom:2rem; font-style:italic;">
            <strong>ÖZET:</strong> ${decision.ozet || 'Özet bulunmuyor.'}
        </div>

        <div class="article-content-area" style="font-family:'Times New Roman', serif; font-size:1.1rem; line-height:1.6; text-align:justify;">
            ${decision.icerik ? decision.icerik.replace(/\n/g, '<br>') : 'İçerik girilmemiş.'}
        </div>
    </div>
    `;
        },

        // --- PETITIONS (Dava Dilekçeleri) ---
        renderPetitions: function (container) {
            let rows = '';

            // Comprehensive Seed Data
            if (!app.state.petitions || app.state.petitions.length === 0) {
                const templates = [
                    // 1. Aile Hukuku
                    { cat: 'Aile Hukuku', title: 'Anlaşmalı Boşanma Dilekçesi' },
                    { cat: 'Aile Hukuku', title: 'Çekişmeli Boşanma Dilekçesi' },
                    { cat: 'Aile Hukuku', title: 'Velayet Davası Dilekçesi' },
                    { cat: 'Aile Hukuku', title: 'Nafaka Artırım / Azaltım Dilekçesi' },
                    { cat: 'Aile Hukuku', title: 'Soybağı (Babalık) Davası Dilekçesi' },
                    { cat: 'Aile Hukuku', title: 'Mal Paylaşımı (Mal Rejimi) Davası Dilekçesi' },

                    // 2. Ceza Hukuku
                    { cat: 'Ceza Hukuku', title: 'Suç Duyurusu Dilekçesi' },
                    { cat: 'Ceza Hukuku', title: 'Şikayet Dilekçesi' },
                    { cat: 'Ceza Hukuku', title: 'Kamu Davasına Katılma (Müdahillik) Dilekçesi' },
                    { cat: 'Ceza Hukuku', title: 'HAGB İtiraz Dilekçesi' },
                    { cat: 'Ceza Hukuku', title: 'İstinaf Dilekçesi (Ceza)' },

                    // 3. Hukuk (Medeni)
                    { cat: 'Hukuk (Medeni) Davaları', title: 'Alacak Davası Dilekçesi' },
                    { cat: 'Hukuk (Medeni) Davaları', title: 'Tazminat Davası (Maddi / Manevi)' },
                    { cat: 'Hukuk (Medeni) Davaları', title: 'Tapu İptal ve Tescil Davası' },
                    { cat: 'Hukuk (Medeni) Davaları', title: 'Ecrimisil (Haksız İşgal Tazminatı) Davası' },
                    { cat: 'Hukuk (Medeni) Davaları', title: 'İtirazın İptali Davası' },
                    { cat: 'Hukuk (Medeni) Davaları', title: 'Menfi Tespit Davası' },
                    { cat: 'Hukuk (Medeni) Davaları', title: 'Ortaklığın Giderilmesi (İzale-i Şuyu) Davası' },

                    // 4. İş Hukuku
                    { cat: 'İş Hukuku', title: 'Kıdem Tazminatı Davası' },
                    { cat: 'İş Hukuku', title: 'İhbar Tazminatı Davası' },
                    { cat: 'İş Hukuku', title: 'İşe İade Davası' },
                    { cat: 'İş Hukuku', title: 'Fazla Mesai Alacağı Davası' },
                    { cat: 'İş Hukuku', title: 'Hizmet Tespiti Davası' },

                    // 5. İdare Hukuku
                    { cat: 'İdare Hukuku', title: 'İptal Davası' },
                    { cat: 'İdare Hukuku', title: 'Tam Yargı (Tazminat) Davası' },
                    { cat: 'İdare Hukuku', title: 'Yürütmenin Durdurulması Talebi' },
                    { cat: 'İdare Hukuku', title: 'İdari Para Cezasına İtiraz' },

                    // 6. Trafik ve Sigorta
                    { cat: 'Trafik ve Sigorta', title: 'Trafik Kazası Tazminat Davası' },
                    { cat: 'Trafik ve Sigorta', title: 'Değer Kaybı Davası' },
                    { cat: 'Trafik ve Sigorta', title: 'Sigorta Şirketine Karşı Tazminat Davası' },

                    // 7. İcra ve İflas
                    { cat: 'İcra ve İflas Hukuku', title: 'İtirazın Kaldırılması Davası' },
                    { cat: 'İcra ve İflas Hukuku', title: 'İflas Davası' },
                    { cat: 'İcra ve İflas Hukuku', title: 'İcra Takibine İtiraz Dilekçesi' },
                    { cat: 'İcra ve İflas Hukuku', title: 'Haczin Kaldırılması Talebi' },

                    // 8. Tüketici
                    { cat: 'Tüketici Davaları', title: 'Ayıplı Mal Davası' },
                    { cat: 'Tüketici Davaları', title: 'Tüketici Hakem Heyeti Başvurusu' },
                    { cat: 'Tüketici Davaları', title: 'Sözleşme İptali Davası' }
                ];

                app.state.petitions = templates.map((t, index) => ({
                    id: index + 1,
                    title: t.title,
                    category: t.cat,
                    content: `[${t.title} Örneği]\n\nNÖBETÇİ MAHKEMESİ'NE\n\nDAVACI: ...\nDAVALI: ...\nKONU: ...\n\nAÇIKLAMALAR:\n1-\n2-\n\nNETİCE VE TALEP: ...`,
                    media: []
                }));
            }

            app.state.petitions.forEach(p => {
                const mediaIcon = (p.media && p.media.length > 0) ? '<i class="fas fa-paperclip" title="Ekli Dosya" style="margin-left:5px; color:var(--text-secondary);"></i>' : '';
                rows += `
                    <tr>
                        <td data-label="Başlık" onclick="app.router.navigate('petition-detail', {id: ${p.id}})" style="cursor:pointer; color:var(--primary-color); font-weight:600;">${p.title}${mediaIcon}</td>
                        <td data-label="Kategori"><span class="badge" style="background:#f3f4f6; color:#374151;">${p.category}</span></td>
                        <td data-label="İşlemler">
                            <button class="btn secondary small" onclick="app.ui.editPetition(${p.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn secondary small" style="color:var(--danger-color);" onclick="app.ui.deletePetition(${p.id})"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });

            container.innerHTML = `
                <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <div>
                         <h2 class="page-title">Dava Dilekçeleri</h2>
                         <p style="color:var(--text-secondary); font-size:0.9rem;">Hazır dilekçe şablonları ve taslaklarınız.</p>
                    </div>
                    <button class="btn primary" onclick="app.ui.showPetitionModal('Yeni Dilekçe Ekle')"><i class="fas fa-plus"></i> Yeni Dilekçe</button>
                </div>
                 <div class="table-container" style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Başlık</th>
                                <th>Kategori</th>
                                <th style="width:100px;">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        },

        renderPetitionDetail: function (container, params) {
            const petition = app.state.petitions.find(p => p.id == params.id);
            if (!petition) {
                container.innerHTML = '<p>Dilekçe bulunamadı.</p>';
                return;
            }

            const mediaGallery = this.renderMediaGallery(petition.media);

            container.innerHTML = `
                <div style="margin-bottom:1rem;">
                    <button class="btn secondary small" onclick="app.router.navigate('petitions')"><i class="fas fa-arrow-left"></i> Geri Dön</button>
                </div>
                <div style="background:white; padding:2rem; border-radius:8px; border:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                        <h2 style="font-family:var(--font-heading); color:var(--primary-color);">${petition.title}</h2>
                        <span class="status-badge">${petition.category}</span>
                    </div>
                    <div style="white-space: pre-wrap; font-family: 'Times New Roman', serif; line-height: 1.6; padding: 1rem; background: #f9f9f9; border: 1px solid #eee;">${petition.content}</div>
                    ${mediaGallery}
                     <div style="margin-top:2rem; display:flex; justify-content:flex-end; gap:0.5rem;">
                        <button class="btn primary" onclick="app.ui.editPetition(${petition.id})"><i class="fas fa-edit"></i> Düzenle</button>
                        <button class="btn secondary" onclick="app.ui.printPetition(${petition.id})"><i class="fas fa-print"></i> Resmi Yazdır</button>
                    </div>
                </div>
            `;
        },

        showPetitionModal: function (title, pData = null) {
            if (!pData) {
                app.state.editingPetitionId = null;
                pData = { title: '', category: '', content: '', media: [] };
            } else {
                app.state.editingPetitionId = pData.id;
            }

            const mediaInputs = this.getMediaInputHtml('petition');

            this.openModal(title, `
                <div class="form-group">
                    <label>Başlık</label>
                    <input type="text" id="pTitle" value="${pData.title}" placeholder="Örn: Boşanma Dilekçesi">
                </div>
                <div class="form-group">
                    <label>Kategori</label>
                    <input type="text" id="pCategory" value="${pData.category}" placeholder="Örn: Aile Hukuku">
                </div>
                 <div class="form-group">
                    <label>İçerik</label>
                    <textarea id="pContent" rows="10" placeholder="Dilekçe metni...">${pData.content}</textarea>
                </div>
                ${mediaInputs}
            `, () => this.savePetition());

            if (pData.media && pData.media.length > 0) {
                setTimeout(() => {
                    const container = document.getElementById('petitionPreview');
                    if (container) {
                        pData.media.forEach(m => {
                            const wrapper = document.createElement('div');
                            wrapper.className = 'media-item';
                            wrapper.style.cssText = 'position:relative; width:80px; height:80px; border:1px solid #ddd; border-radius:4px; overflow:hidden;';
                            let content = '';
                            if (m.type === 'image') content = `<img src="${m.url}" style="width:100%; height:100%; object-fit:cover;">`;
                            else if (m.type === 'video') content = `<video src="${m.url}" style="width:100%; height:100%; object-fit:cover;"></video>`;
                            else content = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f9f9f9;"><i class="fas fa-link"></i></div>`;

                            wrapper.innerHTML = `
                                ${content}
                                <input type="hidden" class="media-data" value="${m.url}" data-type="${m.type}" data-name="${m.name}">
                                <i class="fas fa-times-circle" style="position:absolute; top:2px; right:2px; color:red; background:#fff; border-radius:50%; cursor:pointer;" onclick="this.parentElement.remove()"></i>
                            `;
                            container.appendChild(wrapper);
                        });
                    }
                }, 0);
            }
        },

        savePetition: function () {
            const title = document.getElementById('pTitle').value;
            const category = document.getElementById('pCategory').value;
            const content = document.getElementById('pContent').value;
            const media = this.collectMediaData('petitionPreview');

            if (!title) { alert("Başlık zorunludur."); return; }

            if (app.state.editingPetitionId) {
                const petition = app.state.petitions.find(p => p.id === app.state.editingPetitionId);
                if (petition) {
                    petition.title = title;
                    petition.category = category;
                    petition.content = content;
                    petition.media = media;
                }
            } else {
                const newId = app.state.petitions.length > 0 ? Math.max(...app.state.petitions.map(p => p.id)) + 1 : 1;
                app.state.petitions.push({
                    id: newId,
                    title: title,
                    category: category,
                    content: content,
                    media: media
                });
            }
            app.saveData();
            app.ui.openModal('Başarılı', '<p>Dilekçe taslağı kaydedildi.</p>', () => app.ui.closeModal());
            this.renderPetitions(document.getElementById('contentArea'));
        },

        editPetition: function (id) {
            const p = app.state.petitions.find(x => x.id === id);
            if (p) this.showPetitionModal('Dilekçe Düzenle', p);
        },

        deletePetition: function (id) {
            const pIndex = app.state.petitions.find(x => x.id === id);

            this.openModal('Onay', '<p>Bu dilekçeyi silmek istediğinize emin misiniz?</p>', () => {
                app.state.petitions = app.state.petitions.filter(p => p.id !== id);
                app.saveData();
                app.ui.closeModal();
                this.renderPetitions(document.getElementById('contentArea'));
            });
        },

        // --- PROFILE EDIT ---
        editProfile: function () {
            document.getElementById('profileModal').classList.remove('hidden');
        },

        saveProfile: function () {
            const name = document.getElementById('profileName').value;
            const role = document.getElementById('profileRole').value;
            const fileInput = document.getElementById('profileAvatarInput');

            if (name) {
                if (!app.state.user) app.state.user = {};
                app.state.user.name = name;
                app.state.user.role = role;

                const saveAndClose = () => {
                    document.querySelector('.user-name').textContent = app.state.user.name;
                    document.querySelector('.user-role').textContent = app.state.user.role;

                    if (app.state.user.avatar) {
                        const avatarEl = document.querySelector('.user-avatar');
                        avatarEl.innerHTML = `<img src="${app.state.user.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                        avatarEl.style.background = 'transparent';
                    }

                    localStorage.setItem('userProfile', JSON.stringify(app.state.user));
                    document.getElementById('profileModal').classList.add('hidden');
                };

                if (fileInput && fileInput.files && fileInput.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        app.state.user.avatar = e.target.result;
                        saveAndClose();
                    };
                    reader.readAsDataURL(fileInput.files[0]);
                } else {
                    saveAndClose();
                }
            }
        },

        closeProfileModal: function () {
            document.getElementById('profileModal').classList.add('hidden');
        },

        shareArticle: function (title, content) {
            const text = `* ${title}*\n\n${content} `;
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        },

        deleteArticle: function (articleId) {
            if (confirm("Bu maddeyi silmek istediğinize emin misiniz?")) {
                const law = app.state.legislation.find(l => l.id === app.state.currentLawId);
                if (law) {
                    law.articles = law.articles.filter(a => a.id !== articleId);
                    app.saveData();
                    this.renderLegislationDetail(document.getElementById('contentArea'), app.state.currentLawId);
                }
            }
        },

        editArticle: function (articleId) {
            const law = app.state.legislation.find(l => l.id === app.state.currentLawId);
            if (!law) return;
            const article = law.articles.find(a => a.id === articleId);
            if (!article) return;

            app.state.editingArticleId = articleId;
            this.showArticleModal('Madde Düzenle', article);
        },

        showArticleModal: function (title, articleData = null) {
            const elTitle = document.getElementById('modalTitle');
            const elOverlay = document.getElementById('modalOverlay');
            const elBody = document.getElementById('modalBody');

            if (elTitle) elTitle.textContent = title;
            if (elOverlay) elOverlay.classList.remove('hidden');

            if (!articleData) {
                app.state.editingArticleId = null;
                articleData = { number: '', title: '', content: '', media: [] };
            }

            const mediaInputs = this.getMediaInputHtml('article');

            this.openModal(title, `
                <div class="form-group">
                    <label>Madde No</label>
                    <input type="text" id="articleNumber" value="${articleData.number || ''}" placeholder="Örn: 81">
                </div>
                <div class="form-group">
                    <label>Başlık</label>
                    <input type="text" id="articleTitle" value="${articleData.title || ''}" placeholder="Örn: Kasten Öldürme">
                </div>
                 <div class="form-group">
                    <label>İçerik</label>
                    <textarea id="articleContent" rows="6" placeholder="Madde içeriği...">${articleData.content || ''}</textarea>
                </div>
                ${mediaInputs}
            `, () => this.saveArticle());

            // Re-populate preview if editing
            if (articleData.media && articleData.media.length > 0) {
                setTimeout(() => {
                    const container = document.getElementById('articlePreview');
                    if (container) {
                        articleData.media.forEach(m => {
                            const wrapper = document.createElement('div');
                            wrapper.className = 'media-item';
                            wrapper.style.cssText = 'position:relative; width:80px; height:80px; border:1px solid #ddd; border-radius:4px; overflow:hidden;';
                            let content = '';
                            if (m.type === 'image') content = `<img src="${m.url}" style="width:100%; height:100%; object-fit:cover;">`;
                            else if (m.type === 'video') content = `<video src="${m.url}" style="width:100%; height:100%; object-fit:cover;"></video>`;
                            else content = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f9f9f9;"><i class="fas fa-link"></i></div>`;

                            wrapper.innerHTML = `
                                ${content}
                                <input type="hidden" class="media-data" value="${m.url}" data-type="${m.type}" data-name="${m.name}">
                                <i class="fas fa-times-circle" style="position:absolute; top:2px; right:2px; color:red; background:#fff; border-radius:50%; cursor:pointer;" onclick="this.parentElement.remove()"></i>
                            `;
                            container.appendChild(wrapper);
                        });
                    }
                }, 0);
            }
        },

        saveArticle: function () {
            const law = app.state.legislation.find(l => l.id === app.state.currentLawId);
            if (!law) return;

            const number = document.getElementById('articleNumber').value;
            const title = document.getElementById('articleTitle').value;
            const content = document.getElementById('articleContent').value;
            const media = this.collectMediaData('articlePreview');

            if (!number || !title) {
                alert("Madde numarası ve başlığı zorunludur.");
                return;
            }

            if (app.state.editingArticleId) {
                const article = law.articles.find(a => a.id === app.state.editingArticleId);
                if (article) {
                    article.number = number;
                    article.title = title;
                    article.content = content;
                    article.media = media;
                }
            } else {
                const newId = Date.now().toString(); // Simple ID generation
                if (!law.articles) law.articles = [];
                law.articles.push({
                    id: newId,
                    number: number,
                    title: title,
                    content: content,
                    media: media
                });
            }

            app.saveData();
            this.closeModal();
            this.renderLegislationDetail(document.getElementById('contentArea'), app.state.currentLawId);
        },

        // --- TOOLS ---
        renderTools: function (container) {
            container.innerHTML = `
                <div class="tools-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    <!-- Faiz Hesaplama -->
                    <div class="tool-card" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-md);">
                        <h3 style="margin-bottom: 1.5rem; color: var(--primary-color); display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-percentage"></i> Yasal Faiz Hesaplama
                        </h3>
                        <div class="form-group">
                            <label>Ana Para (TL)</label>
                            <input type="number" id="principal" placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label>Faiz Başlangıç Tarihi</label>
                            <input type="date" id="startDate">
                        </div>
                        <div class="form-group">
                            <label>Faiz Bitiş Tarihi</label>
                            <input type="date" id="endDate">
                        </div>
                        <div class="form-group">
                            <label>Faiz Oranı (%)</label>
                            <input type="number" id="rate" value="9" placeholder="9">
                            <small style="color: var(--text-secondary);">Yasal faiz oranı: %9 (Örnek)</small>
                        </div>
                        <button class="btn accent" style="width: 100%; margin-top: 1rem;" onclick="app.ui.calculateInterest()">Hesapla</button>
                        <div id="resultArea" style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-main); border-radius: 8px; display: none;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>Faiz Tutarı:</span>
                                <strong id="interestAmount">0.00 TL</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: var(--primary-color);">
                                <span>Toplam Tutar:</span>
                                <strong id="totalAmount">0.00 TL</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Miras Paylaştırma (Basit) -->
                    <div class="tool-card" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-md);">
                        <h3 style="margin-bottom: 1.5rem; color: var(--primary-color); display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-users"></i> Miras Paylaştırma (Hesapla)
                        </h3>
                        <div class="form-group">
                            <label>Eş Hayatta mı?</label>
                            <select id="mirasEs">
                                <option value="var">Evet</option>
                                <option value="yok">Hayır</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Çocuk Sayısı</label>
                            <input type="number" id="mirasCocuk" value="0" min="0">
                        </div>
                         <div class="form-group">
                            <label>Anne/Baba Hayatta mı?</label>
                            <select id="mirasAnneBaba">
                                <option value="hayir">Hayır</option>
                                <option value="evet">Evet</option>
                            </select>
                        </div>
                        <button class="btn accent" style="width: 100%; margin-top: 1rem;" onclick="app.ui.calculateInheritance()">Hesapla</button>
                        <div id="mirasResult" style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-main); border-radius: 8px; display: none; font-size:0.9rem;"></div>
                    </div>

                    <!-- Vekalet Ücreti (Basit) -->
                    <div class="tool-card" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-md);">
                        <h3 style="margin-bottom: 1.5rem; color: var(--primary-color); display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-file-invoice-dollar"></i> Vekalet Ücreti (Taslak)
                        </h3>
                         <div class="form-group">
                            <label>Dava Değeri (TL)</label>
                            <input type="number" placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label>Mahkeme Türü</label>
                            <select>
                                <option>Asliye Hukuk</option>
                                <option>Sulh Hukuk</option>
                                <option>İcra Hukuk</option>
                            </select>
                        </div>
                        <button class="btn secondary" style="width: 100%; margin-top: 3.5rem;">Yakında...</button>
                    </div>
                </div>
            `;
        },

        calculateInheritance: function () {
            const es = document.getElementById('mirasEs').value === 'var';
            const cocuk = parseInt(document.getElementById('mirasCocuk').value) || 0;
            const annebaba = document.getElementById('mirasAnneBaba').value === 'evet';
            const resEl = document.getElementById('mirasResult');

            let html = '<h4>Sonuç:</h4><ul style="padding-left:1.2rem; margin-top:0.5rem;">';

            // 1. Zümre (Çocuklar)
            if (cocuk > 0) {
                if (es) {
                    html += '<li><strong>Eş:</strong> 1/4 (Çeyrek)</li>';
                    html += `<li><strong>Çocuklar (${cocuk}):</strong> 3/4 (Kalanın tamamı, kişi başı ${(3 / 4 / cocuk).toFixed(2)})</li>`;
                } else {
                    html += `<li><strong>Çocuklar (${cocuk}):</strong> Tamamı (Kişi başı ${(1 / cocuk).toFixed(2)})</li>`;
                }
            }
            // 2. Zümre (Anne/Baba - Çocuk yoksa)
            else if (annebaba) {
                if (es) {
                    html += '<li><strong>Eş:</strong> 1/2 (Yarım)</li>';
                    html += '<li><strong>Anne/Baba:</strong> 1/2 (Yarım)</li>';
                } else {
                    html += '<li><strong>Anne/Baba:</strong> Tamamı</li>';
                }
            }
            // 3. Zümre veya sadece Eş
            else {
                if (es) {
                    html += '<li><strong>Eş:</strong> Tamamı (Eğer büyükanne/baba da yoksa) <small>*Detaylı analiz gerekir</small></li>';
                } else {
                    html += '<li><strong>Devlet:</strong> Tamamı (Kimse yoksa)</li>';
                }
            }
            html += '</ul>';
            resEl.innerHTML = html;
            resEl.style.display = 'block';
        },

        calculateInterest: function () {
            const elP = document.getElementById('principal');
            const elR = document.getElementById('rate');
            const elStart = document.getElementById('startDate');
            const elEnd = document.getElementById('endDate');

            if (!elP || !elR || !elStart || !elEnd) return;

            const p = parseFloat(elP.value) || 0;
            const r = parseFloat(elR.value) || 9;
            const start = new Date(elStart.value);
            const end = new Date(elEnd.value);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                alert("Lütfen geçerli tarih giriniz.");
                return;
            }

            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const interest = (p * diffDays * r) / 36500;
            const total = p + interest;

            const elInt = document.getElementById('interestAmount');
            const elTot = document.getElementById('totalAmount');
            const elRes = document.getElementById('resultArea');

            if (elInt) elInt.textContent = interest.toFixed(2) + ' TL';
            if (elTot) elTot.textContent = total.toFixed(2) + ' TL';
            if (elRes) elRes.style.display = 'block';
        },



        // --- MEDIA HELPERS ---
        getMediaInputHtml: function (type) {
            return `
                <div class="form-group">
                    <label>Medya Ekle (Resim, Video, Link, PDF)</label>
                    <div style="display:flex; gap:0.5rem; margin-bottom:0.5rem; flex-wrap:wrap;">
                        <button class="btn secondary small" onclick="document.getElementById('${type}MediaInput').click()"><i class="fas fa-image"></i> Galeri</button>
                        <button class="btn secondary small" onclick="document.getElementById('${type}MediaInput').click()"><i class="fas fa-file-pdf"></i> Belge / PDF</button>
                        <button class="btn secondary small" onclick="document.getElementById('${type}CameraInput').click()"><i class="fas fa-camera"></i> Kamera</button>
                        <button class="btn secondary small" onclick="app.ui.addLinkInput('${type}')"><i class="fas fa-link"></i> Link</button>
                    </div>
                    <input type="file" id="${type}MediaInput" hidden multiple accept="image/*,video/*,application/pdf" onchange="app.ui.handleMediaSelect(this, '${type}')">
                    <input type="file" id="${type}CameraInput" hidden accept="image/*" capture="environment" onchange="app.ui.handleMediaSelect(this, '${type}')">
                    <div id="${type}Preview" class="media-preview-area" style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.5rem;"></div>
                </div>
            `;
        },

        handleMediaSelect: function (input, type) {
            const container = document.getElementById(`${type}Preview`);
            if (!container) return;

            Array.from(input.files).forEach(file => {
                const url = URL.createObjectURL(file);
                const isImage = file.type.startsWith('image/');
                const isVideo = file.type.startsWith('video/');

                const wrapper = document.createElement('div');
                wrapper.className = 'media-item';
                wrapper.style.cssText = 'position:relative; width:80px; height:80px; border:1px solid #ddd; border-radius:4px; overflow:hidden;';

                let content = '';
                if (isImage) content = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
                else if (isVideo) content = `<video src="${url}" style="width:100%; height:100%; object-fit:cover;"></video>`;
                else content = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f9f9f9;"><i class="fas fa-file-pdf"></i></div>`;

                wrapper.innerHTML = `
                    ${content}
                    <input type="hidden" class="media-data" value="${url}" data-type="${isImage ? 'image' : (isVideo ? 'video' : 'file')}" data-name="${file.name}">
                    <i class="fas fa-times-circle" style="position:absolute; top:2px; right:2px; color:red; background:#fff; border-radius:50%; cursor:pointer;" onclick="this.parentElement.remove()"></i>
                `;
                container.appendChild(wrapper);
            });
            input.value = ''; // Reset
        },

        addLinkInput: function (type) {
            const url = prompt("Link adresi (URL):", "https://");
            if (url) {
                const container = document.getElementById(`${type}Preview`);
                if (!container) return;

                const wrapper = document.createElement('div');
                wrapper.className = 'media-item';
                wrapper.style.cssText = 'position:relative; width:80px; height:80px; border:1px solid #ddd; border-radius:4px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#f9f9f9;';

                wrapper.innerHTML = `
                    <a href="${url}" target="_blank" style="font-size:2rem; color:var(--primary-color);"><i class="fas fa-link"></i></a>
                    <input type="hidden" class="media-data" value="${url}" data-type="link" data-name="Link">
                    <i class="fas fa-times-circle" style="position:absolute; top:2px; right:2px; color:red; background:#fff; border-radius:50%; cursor:pointer;" onclick="this.parentElement.remove()"></i>
                `;
                container.appendChild(wrapper);
            }
        },

        collectMediaData: function (previewId) {
            const container = document.getElementById(previewId);
            if (!container) return [];

            const media = [];
            container.querySelectorAll('.media-item').forEach(item => {
                const input = item.querySelector('.media-data');
                if (input) {
                    media.push({
                        url: input.value,
                        type: input.getAttribute('data-type'),
                        name: input.getAttribute('data-name')
                    });
                }
            });
            return media;
        },

        renderMediaGallery: function (mediaList) {
            if (!mediaList || mediaList.length === 0) return '';

            let html = '<div class="media-gallery" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:1rem; margin-top:1.5rem;">';
            mediaList.forEach(m => {
                if (m.type === 'image') {
                    html += `<div style="aspect-ratio:1; border-radius:8px; overflow:hidden; border:1px solid #eee; cursor:pointer;" onclick="window.open('${m.url}','_blank')"><img src="${m.url}" style="width:100%; height:100%; object-fit:cover;"></div>`;
                } else if (m.type === 'video') {
                    html += `<div style="aspect-ratio:1; border-radius:8px; overflow:hidden; border:1px solid #eee;"><video src="${m.url}" controls style="width:100%; height:100%; object-fit:cover;"></video></div>`;
                } else if (m.type === 'link') {
                    html += `<a href="${m.url}" target="_blank" style="aspect-ratio:1; border-radius:8px; border:1px solid #eee; display:flex; flex-direction:column; align-items:center; justify-content:center; text-decoration:none; color:var(--text-dark); background:#f9f9f9;"><i class="fas fa-link" style="font-size:1.5rem; margin-bottom:0.5rem;"></i><span style="font-size:0.8rem;">Link</span></a>`;
                } else {
                    html += `<a href="${m.url}" target="_blank" style="aspect-ratio:1; border-radius:8px; border:1px solid #eee; display:flex; flex-direction:column; align-items:center; justify-content:center; text-decoration:none; color:var(--text-dark); background:#f9f9f9;"><i class="fas fa-file-alt" style="font-size:1.5rem; margin-bottom:0.5rem;"></i><span style="font-size:0.8rem;">Dosya</span></a>`;
                }
            });
            html += '</div>';
            return html;
        },

        openModal: function (title, content, onConfirm) {
            const elTitle = document.getElementById('modalTitle');
            const elOverlay = document.getElementById('modalOverlay');
            const elBody = document.getElementById('modalBody');

            if (elTitle) elTitle.textContent = title;
            if (elBody) elBody.innerHTML = content;
            if (elOverlay) elOverlay.classList.remove('hidden');

            const confirmBtn = document.getElementById('modalConfirmBtn');
            if (confirmBtn) {
                // Replace button to clear old event listeners
                const newBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
                newBtn.onclick = onConfirm;
                newBtn.id = 'modalConfirmBtn';
            }
        },

        closeModal: function () {
            const elOverlay = document.getElementById('modalOverlay');
            if (elOverlay) elOverlay.classList.add('hidden');
        },

        // --- TO-DO LIST ---
        renderTodos: function (container) {
            const todos = app.state.todos || [];
            const sortedTodos = [...todos].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            let listHtml = '';
            if (sortedTodos.length === 0) {
                listHtml = '<div style="text-align:center; padding:2rem; color:#888;">Yapılacak görev bulunmuyor.</div>';
            } else {
                sortedTodos.forEach(item => {
                    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !item.completed;
                    listHtml += `
                         <div style="display:flex; align-items:center; padding:1rem; border-bottom:1px solid #eee; background:${item.completed ? '#f9f9f9' : '#fff'}; opacity:${item.completed ? 0.6 : 1};">
                             <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="app.ui.toggleTodo('${item.id}')" style="margin-right:1rem; transform:scale(1.2);">
                             <div style="flex:1;">
                                 <div style="font-weight:600; text-decoration:${item.completed ? 'line-through' : 'none'};">${item.text}</div>
                                 <div style="font-size:0.8rem; color:${isOverdue ? 'red' : '#666'};">
                                     <i class="far fa-calendar"></i> ${item.dueDate || 'Tarih Yok'} 
                                     ${isOverdue ? '(Gecikmiş)' : ''}
                                 </div>
                             </div>
                             <button class="btn secondary small" style="color:red;" onclick="app.ui.deleteTodo('${item.id}')"><i class="fas fa-trash"></i></button>
                         </div>
                     `;
                });
            }

            container.innerHTML = `
                 <div class="section-header">
                     <h2><i class="fas fa-check-square"></i> Yapılacaklar Listesi</h2>
                     <button class="btn primary" onclick="app.ui.showTodoModal()"><i class="fas fa-plus"></i> Görev Ekle</button>
                 </div>
                 <div style="background:white; border-radius:8px; border:1px solid #ddd; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                     ${listHtml}
                 </div>
             `;
        },

        showTodoModal: function () {
            this.openModal('Yeni Görev Ekle', `
                 <div class="form-group">
                     <label>Görev Tanımı</label>
                     <input type="text" id="todoText" placeholder="Örn: Ahmet Bey ile görüşme">
                 </div>
                 <div class="form-group">
                     <label>Son Tarih</label>
                     <input type="date" id="todoDate">
                 </div>
             `, () => {
                const text = document.getElementById('todoText').value;
                const date = document.getElementById('todoDate').value;
                if (!text) return alert("Görev tanımı giriniz.");

                app.state.todos.push({
                    id: Date.now().toString(),
                    text,
                    dueDate: date,
                    completed: false
                });
                app.saveData();
                this.closeModal();
                this.renderTodos(document.getElementById('contentArea'));
            });
        },

        toggleTodo: function (id) {
            const todo = app.state.todos.find(t => t.id === id);
            if (todo) {
                todo.completed = !todo.completed;
                app.saveData();
                this.renderTodos(document.getElementById('contentArea'));
            }
        },

        deleteTodo: function (id) {
            if (confirm("Görevi silmek istiyor musunuz?")) {
                app.state.todos = app.state.todos.filter(t => t.id !== id);
                app.saveData();
                this.renderTodos(document.getElementById('contentArea'));
            }
        },

        fillTemplateFromCase: function () {
            const caseId = document.getElementById('templateCaseSelect').value;
            if (!caseId) return alert("Lütfen bir dava seçiniz.");

            const kase = app.state.cases.find(c => c.id === caseId);
            if (!kase) return;

            const client = app.state.clients.find(c => c.id === kase.clientId);
            const clientName = client ? client.name : "MÜVEKKİL ADI";

            let content = document.getElementById('petitionContent').value;

            if (!content) {
                content = `ASLİYE HUKUK MAHKEMESİNE

DAVACI: ${clientName}
VEKİLİ: Av. Adınız Soyadınız
DAVALI: ...
KONU: ${kase.title} hakkında.
KABUL TARİHİ: ${kase.startDate}

AÇIKLAMALAR:
1. ...
2. ...

SONUÇ VE İSTEM: ...`;
            } else {
                content = content.replace(/{MÜVEKKİL}/g, clientName);
                content = content.replace(/{DAVA_KONUSU}/g, kase.title);
                content = content.replace(/{MAHKEME}/g, kase.court);
                content += `\n\n[Eklenen Bilgi: Davacı ${clientName}, Mahkeme ${kase.court}]`;
            }

            document.getElementById('petitionContent').value = content;
        },



        // --- ACCOUNTING / FINANCE ---
        renderFinance: function (container) {
            const finance = app.state.finance || { transactions: [] };
            const transactions = finance.transactions || [];

            // Calculate Stats
            const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
            const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
            const net = income - expense;

            let listHtml = '';
            if (transactions.length === 0) {
                listHtml = '<tr><td colspan="5" style="text-align:center; padding:1rem;">Kayıt bulunamadı.</td></tr>';
            } else {
                [...transactions].reverse().forEach(t => {
                    listHtml += `
                        <tr>
                            <td>${t.date}</td>
                            <td>${t.description}</td>
                            <td>${t.clientId ? (app.state.clients.find(c => c.id === t.clientId)?.name || 'Bilinmiyor') : '-'}</td>
                            <td><span class="badge" style="background:${t.type === 'income' ? '#dcfce7' : '#fee2e2'}; color:${t.type === 'income' ? '#166534' : '#991b1b'}">${t.type === 'income' ? 'Gelir' : 'Gider'}</span></td>
                            <td style="font-weight:bold; color:${t.type === 'income' ? 'green' : 'red'}">${parseFloat(t.amount).toLocaleString('tr-TR')} TL</td>
                            <td><i class="fas fa-trash" style="cursor:pointer; color:red;" onclick="app.ui.deleteTransaction('${t.id}')"></i></td>
                        </tr>
                    `;
                });
            }

            container.innerHTML = `
                <div class="section-header">
                    <h2><i class="fas fa-coins"></i> Muhasebe / Finans</h2>
                    <button class="btn primary" onclick="app.ui.showTransactionModal()"><i class="fas fa-plus"></i> İşlem Ekle</button>
                </div>
                
                <div class="dashboard-grid" style="margin-bottom:2rem;">
                    <div class="stat-card">
                        <div class="icon" style="background:#dcfce7; color:#166534;"><i class="fas fa-arrow-down"></i></div>
                        <div class="data">
                            <h3>Toplam Gelir</h3>
                            <p class="number" style="color:#166534;">${income.toLocaleString('tr-TR')} TL</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="icon" style="background:#fee2e2; color:#991b1b;"><i class="fas fa-arrow-up"></i></div>
                        <div class="data">
                            <h3>Toplam Gider</h3>
                            <p class="number" style="color:#991b1b;">${expense.toLocaleString('tr-TR')} TL</p>
                        </div>
                    </div>
                     <div class="stat-card">
                        <div class="icon" style="background:#e0f2fe; color:#075985;"><i class="fas fa-wallet"></i></div>
                        <div class="data">
                            <h3>Net Durum</h3>
                            <p class="number" style="color:${net >= 0 ? '#075985' : 'red'};">${net.toLocaleString('tr-TR')} TL</p>
                        </div>
                    </div>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Tarih</th>
                                <th>Açıklama</th>
                                <th>İlişkili Müvekkil</th>
                                <th>Tür</th>
                                <th>Tutar</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${listHtml}
                        </tbody>
                    </table>
                </div>
            `;
        },

        showTransactionModal: function () {
            let clientOptions = '<option value="">Seçiniz (Opsiyonel)</option>';
            app.state.clients.forEach(c => {
                clientOptions += `<option value="${c.id}">${c.name}</option>`;
            });

            this.openModal('Yeni İşlem Ekle', `
                <div class="form-group">
                    <label>İşlem Türü</label>
                    <select id="transType">
                        <option value="income">Gelir (Tahsilat)</option>
                        <option value="expense">Gider (Masraf)</option>
                    </select>
                </div>
                 <div class="form-group">
                    <label>Tutar (TL)</label>
                    <input type="number" id="transAmount" placeholder="0.00">
                </div>
                 <div class="form-group">
                    <label>Tarih</label>
                    <input type="date" id="transDate" value="${new Date().toISOString().split('T')[0]}">
                </div>
                 <div class="form-group">
                    <label>Açıklama</label>
                    <input type="text" id="transDesc" placeholder="Örn: Danışmanlık Ücreti">
                </div>
                 <div class="form-group">
                    <label>İlişkili Müvekkil</label>
                    <select id="transClient">${clientOptions}</select>
                </div>
            `, () => {
                const type = document.getElementById('transType').value;
                const amount = document.getElementById('transAmount').value;
                const date = document.getElementById('transDate').value;
                const desc = document.getElementById('transDesc').value;
                const clientId = document.getElementById('transClient').value;

                if (!amount || !desc) return alert("Tutar ve açıklama zorunludur.");

                if (!app.state.finance) app.state.finance = { transactions: [] };
                app.state.finance.transactions.push({
                    id: Date.now().toString(),
                    type, amount, date, description: desc, clientId
                });
                app.saveData();
                this.closeModal();
                this.renderFinance(document.getElementById('contentArea'));
            });
        },

        deleteTransaction: function (id) {
            if (confirm("Bu işlemi silmek istiyor musunuz?")) {
                app.state.finance.transactions = app.state.finance.transactions.filter(t => t.id !== id);
                app.saveData();
                this.renderFinance(document.getElementById('contentArea'));
            }
        },

        // --- CALENDAR ---
        renderCalendar: function (container) {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            // Simple Calendar Logic
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 Sun, 1 Mon...
            // Adjust for Monday start
            let startingDay = firstDay === 0 ? 6 : firstDay - 1;

            let calHtml = '';
            let day = 1;

            // Collect events
            const events = [];
            app.state.cases.forEach(c => {
                if (c.nextHearing) {
                    const d = new Date(c.nextHearing);
                    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                        events.push({ day: d.getDate(), type: 'hearing', title: c.title, id: c.id });
                    }
                }
            });
            app.state.todos.forEach(t => {
                if (t.dueDate) {
                    const d = new Date(t.dueDate);
                    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && !t.completed) {
                        events.push({ day: d.getDate(), type: 'todo', title: t.text, id: t.id });
                    }
                }
            });


            for (let i = 0; i < 6; i++) { // Max 6 rows
                let rowHtml = '<tr>';
                for (let j = 0; j < 7; j++) {
                    if (i === 0 && j < startingDay) {
                        rowHtml += '<td style="background:#f9f9f9;"></td>';
                    } else if (day > daysInMonth) {
                        rowHtml += '<td style="background:#f9f9f9;"></td>';
                    } else {
                        const dayEvents = events.filter(e => e.day === day);
                        let eventHtml = '';
                        dayEvents.forEach(e => {
                            const color = e.type === 'hearing' ? '#fee2e2' : '#e0f2fe';
                            const textCol = e.type === 'hearing' ? '#991b1b' : '#075985';
                            const icon = e.type === 'hearing' ? 'fa-gavel' : 'fa-check';
                            eventHtml += `<div style="background:${color}; color:${textCol}; font-size:0.75rem; padding:2px 4px; border-radius:3px; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                <i class="fas ${icon}"></i> ${e.title}
                             </div>`;
                        });

                        const isToday = day === today.getDate() && currentMonth === today.getMonth();
                        rowHtml += `
                            <td style="height:100px; vertical-align:top; border:1px solid #eee; padding:5px; background:${isToday ? '#fffbeb' : '#fff'};">
                                <div style="font-weight:bold; color:#ccc; margin-bottom:5px;">${day}</div>
                                ${eventHtml}
                            </td>
                         `;
                        day++;
                    }
                }
                rowHtml += '</tr>';
                if (day > daysInMonth) {
                    calHtml += rowHtml;
                    break;
                }
                calHtml += rowHtml;
            }

            container.innerHTML = `
                <div class="section-header">
                    <h2><i class="fas fa-calendar-alt"></i> Ajanda</h2>
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <div>${new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</div>
                        <button class="btn secondary small" onclick="app.ui.exportCalendar()"><i class="fas fa-download"></i> İndir (.ics)</button>
                    </div>
                </div>
                 <div style="background:white; border-radius:8px; border:1px solid #ddd; overflow:hidden;">
                    <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
                        <thead>
                            <tr style="background:#f1f5f9; text-align:center;">
                                <th style="padding:10px;">Pzt</th>
                                <th style="padding:10px;">Sal</th>
                                <th style="padding:10px;">Çar</th>
                                <th style="padding:10px;">Per</th>
                                <th style="padding:10px;">Cum</th>
                                <th style="padding:10px; color:red;">Cmt</th>
                                <th style="padding:10px; color:red;">Paz</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${calHtml}
                        </tbody>
                    </table>
                </div>
            `;
        },

        // --- AI CHATBOT ---
        initChat: function () {
            const chatHtml = `
                <div class="chat-fab" onclick="app.ui.toggleChat()">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="chat-window" id="chatWindow">
                    <div class="chat-header">
                        <div>
                            <i class="fas fa-robot" style="margin-right:10px;"></i> Hukuk Asistanı
                        </div>
                        <i class="fas fa-times" onclick="app.ui.toggleChat()" style="cursor:pointer;"></i>
                    </div>
                    <div class="chat-body" id="chatBody">
                        <div class="chat-message bot">
                            Merhaba! Ben Hukuk Asistanınız. Mevzuat, davalarınız veya genel hukuki konularda size nasıl yardımcı olabilirim?
                        </div>
                    </div>
                    <div class="chat-input-area">
                        <input type="text" id="chatInput" placeholder="Bir soru sorun..." onkeypress="if(event.key==='Enter') app.ui.sendChatMessage()">
                        <button class="btn primary small" onclick="app.ui.sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            `;
            const div = document.createElement('div');
            div.innerHTML = chatHtml;
            document.body.appendChild(div);
        },

        toggleChat: function () {
            const win = document.getElementById('chatWindow');
            win.classList.toggle('open');
            if (win.classList.contains('open')) {
                document.getElementById('chatInput').focus();
            }
        },

        sendChatMessage: function () {
            const input = document.getElementById('chatInput');
            const text = input.value.trim();
            if (!text) return;

            const body = document.getElementById('chatBody');

            // User Message
            body.innerHTML += `<div class="chat-message user">${text}</div>`;
            input.value = '';
            body.scrollTop = body.scrollHeight;

            // Simulate Typing
            const typingId = 'typing-' + Date.now();
            body.innerHTML += `<div class="typing-indicator" id="${typingId}" style="display:block;">Asistan yazıyor...</div>`;
            body.scrollTop = body.scrollHeight;

            setTimeout(() => {
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();

                let response = "Bu konuda şu an için yeterli bilgim yok. Ancak mevzuat modülünden detaylı arama yapabilirsiniz.";

                // Simple Logic
                const lowerText = text.toLowerCase();
                if (lowerText.includes('ceza') || lowerText.includes('tck')) {
                    response = "Türk Ceza Kanunu ile ilgili sorularınız için Mevzuat bölümünü inceleyebilirsiniz. Hakaret (Madde 125), Tehdit (Madde 106) gibi suçlar sıkça sorulmaktadır.";
                } else if (lowerText.includes('boşanma') || lowerText.includes('aile')) {
                    response = "Boşanma davaları Türk Medeni Kanunu kapsamındadır. Çekişmeli ve Anlaşmalı boşanma türleri mevcuttur. Davalar kısmından 'Aile Hukuku' türündeki dosyalarınızı kontrol edebilirsiniz.";
                } else if (lowerText.includes('dava') && lowerText.includes('kaç')) {
                    const count = app.state.cases.filter(c => c.status === 'Açık').length;
                    response = `Şu anda sistemde <strong>${count}</strong> adet açık davanız bulunmaktadır.`;
                } else if (lowerText.includes('müvekkil') && lowerText.includes('sayı')) {
                    const count = app.state.clients.filter(c => c.status === 'Aktif').length;
                    response = `Portföyünüzde <strong>${count}</strong> adet aktif müvekkil bulunmaktadır.`;
                }

                body.innerHTML += `<div class="chat-message bot">${response}</div>`;
                body.scrollTop = body.scrollHeight;
            }, 1500);
        },

        // --- OFFICIAL DOCUMENTS ---
        printPetition: function (id) {
            const petition = app.state.petitions.find(p => p.id === id);
            if (!petition) return;

            const printDiv = document.createElement('div');
            printDiv.className = 'print-area';
            printDiv.innerHTML = `
                <div class="official-letter">
                    <div class="letter-header">
                        <h2>AVUKAT KULLANICI ADI SOYADI</h2>
                        <p>Adres: Hukuk Bürosu Adresi, İstanbul | Tel: 0555 555 55 55 | E-posta: avukat@mail.com</p>
                    </div>
                    <div class="letter-body">
                        ${petition.content.replace(/\n/g, '<br>')}
                    </div>
                    <div class="letter-footer">
                        <p><strong>Av. Kullanıcı Adı Soyadı</strong></p>
                        <p>(İmza)</p>
                    </div>
                </div>
            `;
            document.body.appendChild(printDiv);
            window.print();
            setTimeout(() => {
                document.body.removeChild(printDiv);
            }, 1000);
        },

        // --- CALENDAR EXPORT ---
        exportCalendar: function () {
            let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HukukAsistani//TR\n";

            app.state.cases.forEach(c => {
                if (c.nextHearing) {
                    const d = c.nextHearing.replace(/-/g, '');
                    icsContent += `BEGIN:VEVENT\nSUMMARY:${c.title} (Duruşma)\nDTSTART;VALUE=DATE:${d}\nDTEND;VALUE=DATE:${d}\nDESCRIPTION:Mahkeme: ${c.court}\nEND:VEVENT\n`;
                }
            });

            app.state.todos.forEach(t => {
                if (t.dueDate) {
                    const d = t.dueDate.replace(/-/g, '');
                    icsContent += `BEGIN:VEVENT\nSUMMARY:${t.text} (Görev)\nDTSTART;VALUE=DATE:${d}\nDTEND;VALUE=DATE:${d}\nEND:VEVENT\n`;
                }
            });

            icsContent += "END:VCALENDAR";

            const blob = new Blob([icsContent], { type: 'text/calendar' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'hukuk_ajandasi.ics';
            a.click();
            window.URL.revokeObjectURL(url);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
    app.ui.initChat();
});
