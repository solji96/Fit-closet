import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export const CATEGORY_ACCORDION_DEFAULT_OPEN = false;

export function isCategoryPanelVisible(open: boolean, forceOpen: boolean): boolean {
  return forceOpen || open;
}

interface Props {
  title: string;
  labelledBy?: string;
  meta?: ReactNode;
  forceOpen?: boolean;
  children: ReactNode;
}

export function CategoryAccordion({
  title,
  labelledBy,
  meta,
  forceOpen = false,
  children,
}: Props) {
  const generatedId = useId();
  const headingId = labelledBy ?? generatedId;
  const panelId = `${headingId}-panel`;
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(CATEGORY_ACCORDION_DEFAULT_OPEN);
  const expanded = isCategoryPanelVisible(open, forceOpen);

  useEffect(() => {
    if (!forceOpen) return;
    const node = detailsRef.current;
    if (node && !node.open) node.open = true;
  }, [forceOpen]);

  return (
    <details
      ref={detailsRef}
      className="category-accordion"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        className="category-accordion-summary"
        aria-expanded={expanded}
        aria-controls={panelId}
        id={headingId}
      >
        <span className="category-accordion-title">{title}</span>
        <span className="category-accordion-meta">{meta}</span>
      </summary>
      <div className="category-accordion-body" id={panelId} role="group" aria-labelledby={headingId}>
        {children}
      </div>
    </details>
  );
}
