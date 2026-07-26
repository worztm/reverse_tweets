import { useEffect, useRef, useCallback, ReactNode, ComponentType, HTMLAttributes } from "react";

export function useScrollAnimation(
  options: {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
  } = {}
) {
  const { threshold = 0.1, rootMargin = "0px 0px -50px 0px", triggerOnce = true } = options;

  const elementsRef = useRef<Element[]>([]);

  const observe = useCallback(
    (element: Element | null) => {
      if (!element) return;
      elementsRef.current.push(element);
    },
    []
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    elementsRef.current.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      elementsRef.current = [];
    };
  }, [threshold, rootMargin, triggerOnce]);

  return observe;
}

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  style?: Record<string, string | number>;
  as?: ComponentType<HTMLAttributes<HTMLElement>> | keyof JSX.IntrinsicElements;
  [key: string]: unknown;
}

export function AnimateOnScroll({
  children,
  className = "",
  style = {},
  as: Component = "div",
  ...props
}: AnimateOnScrollProps) {
  const observe = useScrollAnimation();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      observe(ref.current);
    }
  }, [observe]);

  const ComponentTag = Component as keyof JSX.IntrinsicElements;

  return (
    <ComponentTag
      ref={ref}
      className={className}
      style={style}
      data-animate="true"
      {...props}
    >
      {children}
    </ComponentTag>
  );
}
