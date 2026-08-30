import type { ReactNode } from "react";
import { Overlay } from "@/features/admin/components/Overlay";

interface EventPanelProps {
  closeHref: string;
  triggerId?: string;
  label: string;
  children: ReactNode;
}

export function EventPanel({ closeHref, triggerId, label, children }: EventPanelProps) {
  return (
    <Overlay
      closeHref={closeHref}
      triggerId={triggerId}
      label={label}
      className="event-panel"
      bodyClassName="event-panel__body"
      closeButtonClassName="event-panel__close"
      closeLabel="إغلاق مساحة الفعالية"
    >
      {children}
    </Overlay>
  );
}
