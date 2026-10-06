(function () {
    const STORAGE_PREFIX = 'wasteDashboardLayout:';
    const MAX_WIDTH_PX = 900;
    const MAX_HEIGHT_PX = 700;

    function clampPx(value, max) {
        const n = parseFloat(value);
        if (!Number.isFinite(n)) return null;
        return Math.min(n, max) + 'px';
    }

    function restoreSize(el, key) {
        const saved = localStorage.getItem(key + ':size');
        if (!saved) return;
        try {
            const size = JSON.parse(saved);
            const w = clampPx(size.w, MAX_WIDTH_PX);
            const h = clampPx(size.h, MAX_HEIGHT_PX);
            if (w) el.style.width = w;
            if (h) el.style.height = h;
        } catch (e) {
            /* ignore malformed entry */
        }
    }

    function observeResize(el, key) {
        if (!window.ResizeObserver) return;
        let debounce = null;
        new ResizeObserver(() => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                const rect = el.getBoundingClientRect();
                localStorage.setItem(key + ':size', JSON.stringify({
                    w: Math.round(rect.width) + 'px',
                    h: Math.round(rect.height) + 'px'
                }));
            }, 200);
        }).observe(el);
    }

    function restoreOrder(container, key, items) {
        const saved = localStorage.getItem(key + ':order');
        if (!saved) return;
        try {
            const order = JSON.parse(saved);
            order.forEach(id => {
                const el = items.find(i => i.dataset.widgetId === id);
                if (el) container.appendChild(el);
            });
        } catch (e) {
            /* ignore malformed entry */
        }
    }

    function saveOrder(container, key) {
        const order = Array.from(container.children).map(el => el.dataset.widgetId);
        localStorage.setItem(key + ':order', JSON.stringify(order));
    }

    function enableDragReorder(container, key) {
        let dragEl = null;
        container.querySelectorAll('[data-widget-id]').forEach(el => {
            el.setAttribute('draggable', 'true');
            el.addEventListener('dragstart', () => {
                dragEl = el;
                el.classList.add('dragging');
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                dragEl = null;
                saveOrder(container, key);
            });
            el.addEventListener('dragover', e => {
                e.preventDefault();
                if (!dragEl || dragEl === el) return;
                const rect = el.getBoundingClientRect();
                const before = (e.clientX - rect.left) < rect.width / 2;
                container.insertBefore(dragEl, before ? el : el.nextSibling);
            });
        });
    }

    window.initAdjustableSection = function (sectionId, sectionKey) {
        const container = document.getElementById(sectionId);
        if (!container) return;
        const storageKey = STORAGE_PREFIX + sectionKey;
        const items = Array.from(container.querySelectorAll('[data-widget-id]'));

        items.forEach(el => restoreSize(el, storageKey + ':' + el.dataset.widgetId));
        restoreOrder(container, storageKey, items);

        items.forEach(el => observeResize(el, storageKey + ':' + el.dataset.widgetId));
        enableDragReorder(container, storageKey);
    };

    window.resetAdjustableLayout = function () {
        Object.keys(localStorage)
            .filter(k => k.startsWith(STORAGE_PREFIX))
            .forEach(k => localStorage.removeItem(k));
        location.reload();
    };
})();
