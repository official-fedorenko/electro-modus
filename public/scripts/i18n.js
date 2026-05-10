(function() {
    // Получаем текущий язык из памяти или ставим LT по умолчанию
    let currentLang = localStorage.getItem('app-lang') || 'lt';

    function updatePageContent() {
        const elements = document.querySelectorAll('[data-t]');
        elements.forEach(el => {
            const key = el.getAttribute('data-t');
            if (translations[currentLang] && translations[currentLang][key]) {
                // Если в теге есть HTML (например, <br>), используем innerHTML
                if (translations[currentLang][key].includes('<')) {
                    el.innerHTML = translations[currentLang][key];
                } else {
                    el.textContent = translations[currentLang][key];
                }
            }
        });

        // Обновляем состояние кнопок переключателя
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('lang-btn--active', btn.dataset.lang === currentLang);
        });

        // Устанавливаем атрибут lang для тега html
        document.documentElement.lang = currentLang;
    }

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('app-lang', lang);
        updatePageContent();
    }

    // Экспонируем функции глобально
    window.setLanguage = setLanguage;

    // Инициализация при загрузке DOM
    document.addEventListener('DOMContentLoaded', () => {
        updatePageContent();

        // Если переключатель уже есть в DOM, вешаем события (хотя они могут быть встроены в onclick)
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
        });
    });
})();
