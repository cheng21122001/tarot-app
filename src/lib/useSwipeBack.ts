import { useEffect } from 'react';

// 右滑返回：手指在页面上向右划，页面跟着移动，划过三分之一屏宽（或快速一甩）就返回，否则弹回。
// 从输入框、可横向滚动的区域（如大运）里起手不触发，免得和打字、选字、横滑冲突。
const IGNORE = 'input, textarea, select, [data-hscroll], .modal-backdrop';

export function useSwipeBack(enabled: boolean, onBack: () => void) {
  useEffect(() => {
    if (!enabled) return;
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let tracking = false;
    let dragging = false;
    let page: HTMLElement | null = null;

    const reset = (animate: boolean) => {
      if (!page) return;
      page.style.transition = animate ? 'transform .2s ease-out, opacity .2s ease-out' : '';
      page.style.transform = '';
      page.style.opacity = '';
    };

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      tracking = e.touches.length === 1 && !(e.target as Element).closest?.(IGNORE);
      dragging = false;
      startX = t.clientX;
      startY = t.clientY;
      startT = e.timeStamp;
      page = document.querySelector<HTMLElement>('.page');
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking || !page) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (!dragging) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
          tracking = false; // 是上下滚动
          return;
        }
        if (dx < 12 || Math.abs(dy) > dx * 0.6) return;
        dragging = true;
      }
      e.preventDefault();
      const x = Math.max(0, dx);
      page.style.transition = '';
      page.style.transform = `translateX(${x}px)`;
      page.style.opacity = String(1 - Math.min(x / window.innerWidth, 1) * 0.4);
    };

    const onEnd = (e: TouchEvent) => {
      if (!dragging || !page) {
        tracking = false;
        return;
      }
      const dx = e.changedTouches[0].clientX - startX;
      const fast = dx > 60 && dx / Math.max(e.timeStamp - startT, 1) > 0.5;
      tracking = dragging = false;
      if (dx > window.innerWidth / 3 || fast) {
        page.style.transition = 'transform .15s ease-out, opacity .15s ease-out';
        page.style.transform = `translateX(${window.innerWidth}px)`;
        page.style.opacity = '0';
        window.setTimeout(onBack, 140);
      } else {
        reset(true);
      }
    };

    // 换页后清掉残留的位移，避免下一页停在屏幕外。
    const onRoute = () => {
      document.querySelectorAll<HTMLElement>('.page').forEach((el) => {
        el.style.transition = '';
        el.style.transform = '';
        el.style.opacity = '';
      });
    };
    window.addEventListener('hashchange', onRoute);
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
      window.removeEventListener('hashchange', onRoute);
      reset(false);
      onRoute();
    };
  }, [enabled, onBack]);
}
