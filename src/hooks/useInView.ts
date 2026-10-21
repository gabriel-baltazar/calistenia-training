import { useEffect, useState, type RefObject } from 'react';

export interface UseInViewOptions {
  rootMargin?: string;
  threshold?: number;
}

/** true enquanto o elemento intersecta a viewport (IntersectionObserver). */
export function useInView<T extends Element>(ref: RefObject<T>, { rootMargin = '0px', threshold = 0 }: UseInViewOptions = {}): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setInView(entry.isIntersecting);
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, threshold]);

  return inView;
}
