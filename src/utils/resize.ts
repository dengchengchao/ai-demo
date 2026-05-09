/**
 * Observe size changes on the given element and invoke `cb(width, height)`.
 * Falls back to window resize where ResizeObserver is unavailable.
 * Returns a disposer.
 */
export function onResize(
  el: HTMLElement,
  cb: (width: number, height: number) => void,
): () => void {
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      cb(width, height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }

  const handler = () => cb(el.clientWidth, el.clientHeight);
  window.addEventListener('resize', handler);
  window.addEventListener('orientationchange', handler);
  return () => {
    window.removeEventListener('resize', handler);
    window.removeEventListener('orientationchange', handler);
  };
}
