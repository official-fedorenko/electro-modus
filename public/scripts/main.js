// =============================================
//  ЭЛЕКТРОМОНТАЖ PRO — main.js
//  Multi-page navigation and form handling
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    // 1. Highlight active menu item based on current URL
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const sidebarLinks = document.querySelectorAll('.sidebar__link');
    
    sidebarLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            // Remove active from others
            sidebarLinks.forEach(l => l.classList.remove('active'));
            // Add to current
            link.classList.add('active');
        }
    });

    // 2. Contact form handling
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-form-submit');
            const originalText = btn.textContent;
            
            btn.textContent = '✓ Заявка отправлена';
            btn.style.background = '#2a8a4a';
            btn.disabled = true;

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.disabled = false;
                form.reset();
            }, 3000);
        });
    }

    // 3. Burger Menu for Mobile
    function initBurgerMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // Создаем кнопку бургера
        const burgerBtn = document.createElement('button');
        burgerBtn.className = 'burger-btn';
        burgerBtn.innerHTML = '<span></span><span></span><span></span>';
        document.body.appendChild(burgerBtn);

        // Создаем оверлей
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);

        function toggleMenu() {
            sidebar.classList.toggle('sidebar--open');
            overlay.classList.toggle('sidebar-overlay--active');
            burgerBtn.classList.toggle('burger-btn--active');
            
            // Блокируем скролл при открытом меню
            document.body.style.overflow = sidebar.classList.contains('sidebar--open') ? 'hidden' : '';
        }

        burgerBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);

        // Закрываем меню при клике на ссылку
        const menuLinks = sidebar.querySelectorAll('.sidebar__link');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (sidebar.classList.contains('sidebar--open')) {
                    toggleMenu();
                }
            });
        });
    }

    initBurgerMenu();

    // 4. Sidebar Toggle for Desktop
    function initSidebarToggle() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar || window.innerWidth <= 768) return;

        const toggle = document.createElement('div');
        toggle.className = 'sidebar-toggle';
        toggle.innerHTML = '❮'; 
        document.body.appendChild(toggle); // Добавляем в body, так как позиция fixed

        // Функция обновления позиции кнопки
        function updateTogglePosition(isCollapsed) {
            toggle.style.left = isCollapsed ? '15px' : '205px';
            toggle.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
        }

        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('sidebar--collapsed');
        }
        updateTogglePosition(isCollapsed);

        toggle.addEventListener('click', () => {
            const nowCollapsed = sidebar.classList.toggle('sidebar--collapsed');
            updateTogglePosition(nowCollapsed);
            localStorage.setItem('sidebar-collapsed', nowCollapsed);
        });
    }

    initSidebarToggle();

});
