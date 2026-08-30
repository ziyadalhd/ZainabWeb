"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export interface InspectorTab {
  id: string;
  label: string;
  /** Optional badge count rendered beside the label (roster size, waitlist size, ...). */
  count?: string;
  /** One line of orientation shown above the panel body. */
  lede?: string;
  content: ReactNode;
}

/**
 * The inspector's section switcher: a real `tablist`, not the anchor-link row it replaces.
 * Switching is local state, so moving between roster / waitlist / communications never touches the
 * server and never re-renders the page around the panel.
 *
 * Keyboard follows the APG tabs pattern with roving tabindex. The arrow mapping is inverted for
 * this RTL document: ArrowLeft advances, ArrowRight retreats, so the focus ring always travels the
 * direction the key points on screen.
 */
export function EventInspectorTabs({ tabs, label }: { tabs: readonly InspectorTab[]; label: string }) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId),
  );
  const active = tabs[activeIndex];
  if (!active) return null;

  function focusTab(index: number) {
    const next = tabs[(index + tabs.length) % tabs.length];
    if (!next) return;
    setActiveId(next.id);
    tabRefs.current.get(next.id)?.focus();
  }

  function onKeyDown(keyboardEvent: React.KeyboardEvent<HTMLButtonElement>) {
    const offsets: Record<string, number> = { ArrowLeft: 1, ArrowRight: -1 };
    const offset = offsets[keyboardEvent.key];
    if (offset !== undefined) {
      keyboardEvent.preventDefault();
      focusTab(activeIndex + offset);
      return;
    }
    if (keyboardEvent.key === "Home") {
      keyboardEvent.preventDefault();
      focusTab(0);
    } else if (keyboardEvent.key === "End") {
      keyboardEvent.preventDefault();
      focusTab(tabs.length - 1);
    }
  }

  return (
    <>
      <div role="tablist" aria-label={label} aria-orientation="horizontal" className="event-inspector__tabs">
        {tabs.map((tab) => {
          const selected = tab.id === active.id;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) tabRefs.current.set(tab.id, node);
                else tabRefs.current.delete(tab.id);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className="event-inspector__tab"
              onClick={() => setActiveId(tab.id)}
              onKeyDown={onKeyDown}
            >
              {tab.label}
              {tab.count ? (
                <span className="event-inspector__tab-count numeral" aria-hidden="true">
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-${active.id}`}
        aria-labelledby={`${baseId}-tab-${active.id}`}
        tabIndex={0}
        className="event-inspector__panel"
      >
        {active.lede ? <p className="event-inspector__panel-lede">{active.lede}</p> : null}
        {active.content}
      </div>
    </>
  );
}
