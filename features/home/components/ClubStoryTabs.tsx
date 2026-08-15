"use client";

import { useId, useRef, useState } from "react";

export interface ClubStorySection {
  title: string;
  body: string;
}

function paragraphs(value: string): string[] {
  return value
    .split(/\n\s*\n|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function ClubStoryTabs({ sections }: { sections: readonly ClubStorySection[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabListId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = sections[selectedIndex];

  function selectAndFocus(index: number) {
    const safeIndex = (index + sections.length) % sections.length;
    setSelectedIndex(safeIndex);
    tabRefs.current[safeIndex]?.focus();
  }

  if (!selected) return null;

  return (
    <div className="club-story">
      <div
        id={tabListId}
        role="tablist"
        aria-label="قصة نادي بَيْن"
        className="club-story__tabs"
      >
        {sections.map((section, index) => (
          <button
            key={section.title}
            ref={(element) => { tabRefs.current[index] = element; }}
            id={`${tabListId}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={selectedIndex === index}
            aria-controls={`${tabListId}-panel-${index}`}
            tabIndex={selectedIndex === index ? 0 : -1}
            className="club-story__tab"
            onClick={() => setSelectedIndex(index)}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                selectAndFocus(selectedIndex + 1);
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                selectAndFocus(selectedIndex - 1);
              } else if (event.key === "Home") {
                event.preventDefault();
                selectAndFocus(0);
              } else if (event.key === "End") {
                event.preventDefault();
                selectAndFocus(sections.length - 1);
              }
            }}
          >
            <span aria-hidden="true" className="club-story__mark" />
            {section.title}
          </button>
        ))}
      </div>

      <article
        key={selected.title}
        id={`${tabListId}-panel-${selectedIndex}`}
        role="tabpanel"
        aria-labelledby={`${tabListId}-tab-${selectedIndex}`}
        className="club-story__panel"
        tabIndex={0}
      >
        <p className="eyebrow">من حكايتنا</p>
        <h2 className="mt-3 text-3xl font-black text-[var(--brand-forest)] sm:text-4xl">{selected.title}</h2>
        <div className="mt-5 grid max-w-3xl gap-4 text-lg leading-9 muted-copy">
          {paragraphs(selected.body).map((paragraph, index) => (
            <p key={`${index}-${paragraph}`}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
