import { useEffect, useRef, useCallback } from 'react';

export function useScrollAnimation(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
  } = options;

  const observerRef = useRef(null);
  const elementsRef = useRef([]);

  const observe = useCallback((element) => {
    if (!element) return;
    elementsRef.current.push(element);
    element.classList.add('data-animate');
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    observerRef.current = observer;

    elementsRef.current.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      elementsRef.current = [];
    };
  }, [threshold, rootMargin, triggerOnce]);

  return observe;
}

// Higher-order component to wrap elements with data-animate attribute
export function AnimateOnScroll({ children, className = '', style = {}, as: Component = 'div', ...props }) {
  const observe = useScrollAnimation();
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      observe(ref.current);
    }
  }, [observe]);

  return (
    <Component
      ref={ref}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}
