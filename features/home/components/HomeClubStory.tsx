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

export function HomeClubStory({ sections }: { sections: readonly ClubStorySection[] }) {
  return (
    <section id="story" className="home-story">
      <div className="page-shell section-space home-story__layout">
        <header>
          <p className="eyebrow">حكاية النادي</p>
          <h2>عن بَيْن</h2>
        </header>
        <div className="home-story__list">
          {sections.map((section) => (
            <details key={section.title} className="home-story__item">
              <summary>
                <span>{section.title}</span>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="home-story__content">
                {paragraphs(section.body).map((paragraph, index) => (
                  <p key={`${index}-${paragraph}`}>{paragraph}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
