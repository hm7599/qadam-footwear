/**
 * Attaches a non-passive wheel listener to an overlay/panel element so wheel and
 * trackpad scrolling only scrolls scrollable lists inside the container and never
 * leaks out to move or jitter the background page behind it.
 */
export function bindScrollContain(el: HTMLElement | null): () => void {
  if (!el) return () => {};

  const onWheel = (e: WheelEvent) => {
    let node = e.target as HTMLElement | null;
    while (node && node !== el) {
      const style = window.getComputedStyle(node);
      const canY =
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        node.scrollHeight > node.clientHeight + 1;
      if (canY && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        const atTop = node.scrollTop <= 0 && e.deltaY < 0;
        const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1 && e.deltaY > 0;
        if (!atTop && !atBottom) return;
        break;
      }
      const canX =
        (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
        node.scrollWidth > node.clientWidth + 1;
      if (canX && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const atLeft = node.scrollLeft <= 0 && e.deltaX < 0;
        const atRight = node.scrollLeft + node.clientWidth >= node.scrollWidth - 1 && e.deltaX > 0;
        if (!atLeft && !atRight) return;
        break;
      }
      node = node.parentElement;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  el.addEventListener('wheel', onWheel, { passive: false });
  return () => el.removeEventListener('wheel', onWheel);
}
