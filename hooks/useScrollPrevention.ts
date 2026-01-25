import { useEffect, useRef } from 'react';

export const useScrollPrevention = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalBodyOverflow = window.getComputedStyle(document.body).overflow;
    const originalHtmlOverflow = window.getComputedStyle(document.documentElement).overflow;
    const originalBodyPosition = window.getComputedStyle(document.body).position;
    const originalBodyWidth = window.getComputedStyle(document.body).width;
    const originalBodyHeight = window.getComputedStyle(document.body).height;

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';

    // Add CSS to hide scrollbars globally
    const style = document.createElement('style');
    style.id = 'buggy-no-scroll';
    style.textContent = `
      body::-webkit-scrollbar,
      html::-webkit-scrollbar,
      *::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      body {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.width = originalBodyWidth;
      document.body.style.height = originalBodyHeight;
      document.body.style.top = '';
      document.body.style.left = '';

      const styleElement = document.getElementById('buggy-no-scroll');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: WheelEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollableArea = target.closest('.overflow-y-auto');
      if (!scrollableArea) {
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', preventScroll, { passive: false });
    container.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventScroll);
      container.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  return containerRef;
};
