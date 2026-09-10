import { useEffect, useRef } from 'react';

/**
 * Custom hook that applies the 'visible' class to an element
 * when it enters the viewport, replicating the original
 * IntersectionObserver-based fade-up animation.
 */
export function useIntersectionObserver(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: options.threshold ?? 0.12,
        rootMargin: options.rootMargin ?? '0px 0px -40px 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, [options.threshold, options.rootMargin]);

  return ref;
}

/**
 * Observe all elements matching a selector within a container ref.
 * Useful for grids or lists where multiple children need fade-up.
 */
export function useIntersectionObserverAll(containerRef, selector = '.fade-up', deps = []) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = container.querySelectorAll(selector);
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
