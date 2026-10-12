import type { CSSProperties, ReactNode } from "react";

export function PageFade({ children }: { children: ReactNode }) {
  return <div className="ds-page-enter">{children}</div>;
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const style: CSSProperties | undefined = delay ? { animationDelay: `${delay}s` } : undefined;
  return (
    <div className={className ? `ds-settle ${className}` : "ds-settle"} style={style}>
      {children}
    </div>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `ds-stagger ${className}` : "ds-stagger"}>{children}</div>;
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `ds-settle ${className}` : "ds-settle"}>{children}</div>;
}
