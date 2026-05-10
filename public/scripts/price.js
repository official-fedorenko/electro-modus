document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('price-container');
    const langSwitch = document.getElementById('price-lang-switch');

    let allPrices = [];

    // ─── helpers ────────────────────────────────────────────────────────────────

    function getCurrentLang() {
        return localStorage.getItem('app-lang') || 'lt';
    }

    function syncSwitchButtons(lang) {
        if (!langSwitch) return;
        langSwitch.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }

    // ─── local price-switcher buttons ────────────────────────────────────────────
    // When user clicks LT/RU next to the table we call the GLOBAL setLanguage()
    // so the topbar switcher and the rest of the page also update.
    if (langSwitch) {
        langSwitch.querySelectorAll('button').forEach(btn => {
            btn.onclick = () => {
                if (typeof window.setLanguage === 'function') {
                    window.setLanguage(btn.dataset.lang);   // updates localStorage + topbar
                } else {
                    localStorage.setItem('app-lang', btn.dataset.lang); // fallback
                }
                syncSwitchButtons(btn.dataset.lang);
                renderPrices();
            };
        });

        // Reflect current lang on page load
        syncSwitchButtons(getCurrentLang());
    }

    // ─── react when the GLOBAL switcher (topbar) changes the language ────────────
    // storage events fire in same-tab when other scripts call localStorage.setItem
    window.addEventListener('storage', (e) => {
        if (e.key === 'app-lang') {
            syncSwitchButtons(e.newValue);
            renderPrices();
        }
    });

    // Patch: i18n.js calls localStorage.setItem directly which doesn't fire
    // storage events in the SAME tab. So we also hook into window.setLanguage.
    const _origSetLanguage = window.setLanguage;
    if (typeof _origSetLanguage === 'function') {
        window.setLanguage = function(lang) {
            _origSetLanguage(lang);
            syncSwitchButtons(lang);
            renderPrices();
        };
    }

    // ─── data ────────────────────────────────────────────────────────────────────

    async function loadPrices() {
        try {
            const response = await fetch('/api/prices');
            const data = await response.json();
            allPrices = data.prices;
            renderPrices();
        } catch (err) {
            console.error('Failed to load prices', err);
            if (container) container.innerHTML = '<p style="color:red;">Klaida įkeliant kainas / Ошибка загрузки цен</p>';
        }
    }

    function renderPrices() {
        if (!container) return;
        const lang = getCurrentLang();
        container.innerHTML = '';

        if (allPrices.length === 0) {
            container.innerHTML = '<p>Kainoraštis tuščias / Прайс-лист пуст</p>';
            return;
        }

        // Group by category
        const categories = {};
        allPrices.forEach(p => {
            const cat = p['category_' + lang];
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(p);
        });

        for (const [catName, items] of Object.entries(categories)) {
            const section = document.createElement('div');
            section.className = 'price-group';
            
            let tableHtml = `
                <h3 class="price-group__title">${catName}</h3>
                <div class="price-table-wrap">
                    <table class="price-table">
                        <thead>
                            <tr>
                                <th>${lang === 'lt' ? 'Paslauga' : 'Услуга'}</th>
                                <th>${lang === 'lt' ? 'Vnt.' : 'Ед.'}</th>
                                <th>${lang === 'lt' ? 'Kaina, €' : 'Цена, €'}</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            items.forEach(item => {
                tableHtml += `
                    <tr>
                        <td>${item['name_' + lang]}</td>
                        <td>${item['unit_' + lang]}</td>
                        <td><span class="price-val">${item.price}</span></td>
                    </tr>
                `;
            });

            tableHtml += `
                        </tbody>
                    </table>
                </div>
            `;
            
            section.innerHTML = tableHtml;
            container.appendChild(section);
        }
    }

    loadPrices();
});
