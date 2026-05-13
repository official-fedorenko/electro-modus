(function() {
    // Получаем текущий язык из памяти или ставим LT по умолчанию
    // Получаем язык из памяти, либо определяем по браузеру, либо ставим LT
    let currentLang = localStorage.getItem('app-lang');
    
    if (!currentLang) {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.toLowerCase().startsWith('ru')) {
            currentLang = 'ru';
        } else {
            currentLang = 'lt';
        }
        // Сохраняем определенный язык, чтобы при следующем заходе не гадать
        localStorage.setItem('app-lang', currentLang);
    }

    function updatePageContent() {
        const elements = document.querySelectorAll('[data-t]');
        elements.forEach(el => {
            const key = el.getAttribute('data-t');
            if (translations[currentLang] && translations[currentLang][key]) {
                const translation = translations[currentLang][key];
                
                // Если это инпут или текстовое поле и ключ содержит "placeholder" (или у него есть этот атрибут)
                if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
                    el.placeholder = translation;
                } else if (translation.includes('<')) {
                    el.innerHTML = translation;
                } else {
                    el.textContent = translation;
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
