import Link from "next/link";

const categories = [
  { name: "Smelting", icon: "flame" },
  { name: "Trains", icon: "train" },
  { name: "Circuits", icon: "circuit" },
  { name: "Science", icon: "science" },
  { name: "Oil", icon: "oil" },
  { name: "Power", icon: "power" },
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M12 16V3m0 0L7.5 7.5M12 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" strokeLinecap="round" />
    </svg>
  );
}

function CategoryIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    flame: <path d="M12.6 2.7c.8 4.2-3.5 5.1-3.5 9 0 1.5 1 2.8 2.6 3.2-.5-2.5 1.2-3.8 2.7-5.5.4 2.9 3.5 4.1 3.5 7.4 0 3.5-2.7 5.9-6.2 5.9-3.7 0-6.5-2.7-6.5-6.4 0-5.7 5.7-7.2 7.4-13.6Z" />,
    train: (
      <>
        <rect x="6" y="3" width="12" height="15" rx="5" />
        <path d="M8 18l-2 3m10-3 2 3M9 7h6M8.5 13h.01m6.99 0h.01M8 21h8" />
      </>
    ),
    circuit: (
      <>
        <rect x="5" y="5" width="14" height="14" rx="2" />
        <circle cx="9" cy="9" r="1.2" />
        <circle cx="15" cy="15" r="1.2" />
        <path d="M10.2 9h4.8v4.8M3 8h2m-2 4h2m-2 4h2m14-8h2m-2 4h2m-2 4h2" />
      </>
    ),
    science: (
      <>
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
        <path d="M8 15h8" />
      </>
    ),
    oil: <path d="M12 2.8S5.7 10.2 5.7 15.4a6.3 6.3 0 1 0 12.6 0C18.3 10.2 12 2.8 12 2.8Z" />,
    power: <path d="m13.7 2.5-8 11h6l-1.4 8 8-11h-6l1.4-8Z" />,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function StatusIcon({ type }: { type: "cube" | "copy" | "layers" }) {
  if (type === "copy") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1" />
      </svg>
    );
  }

  if (type === "layers") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
        <path d="m3 12 9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" />
      <path d="m4 6.5 8 4.5 8-4.5M12 11v9" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9Z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 2h8l4 4v16H6V2Z" />
      <path d="M14 2v5h5M9 12h6m-6 4h6" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-glow" />

        <div className="hero-layout">
          <div className="hero-content">
            <p className="hero-kicker">
              <span>Live</span>
              Community blueprint archive
            </p>

            <h1 className="hero-title">
              <span>Find and share</span>
              <span>
                <strong>Factorio</strong> blueprints
              </span>
            </h1>

            <p className="hero-description">
              Browse community-made builds for smelting, trains, circuits,
              <br className="hidden sm:block" /> science, power, Space Age, and more.
            </p>

            <form action="/browse" className="hero-search">
              <SearchIcon />
              <input
                type="search"
                name="q"
                aria-label="Search blueprints"
                placeholder="Search blueprints — ‘red science 60/min’, ‘nuclear’..."
              />
              <button type="submit">Search</button>
            </form>

            <div className="hero-actions">
              <Link href="/browse" className="primary-action">
                <GridIcon />
                Browse Blueprints
              </Link>
              <Link href="/upload" className="secondary-action">
                <UploadIcon />
                Upload Blueprint
              </Link>
            </div>
          </div>

          <aside className="archive-status" aria-label="Archive status">
            <div className="status-header">
              <span className="status-title"><b aria-hidden="true">ϟ</b> Archive status</span>
              <span className="status-online"><i /> Online</span>
            </div>
            <dl>
              <div>
                <dt><StatusIcon type="cube" /> Blueprints</dt>
                <dd>12,480</dd>
              </div>
              <div>
                <dt><StatusIcon type="copy" /> Total copies</dt>
                <dd>2.3M</dd>
              </div>
              <div>
                <dt><StatusIcon type="layers" /> Categories</dt>
                <dd>14</dd>
              </div>
            </dl>
            <div className="status-progress">
              <span><i /></span>
              <b>78% indexed</b>
            </div>
          </aside>
        </div>
      </section>

      <section className="category-section" aria-labelledby="category-heading">
        <div className="category-heading-row">
          <h2 id="category-heading"><span>01</span> Browse by category</h2>
          <Link href="/browse">
            All categories <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <Link key={category.name} href="/browse" className="category-card">
              <span className="category-icon" aria-hidden="true">
                <CategoryIcon name={category.icon} />
              </span>
              <strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      <nav className="view-switcher" aria-label="Page shortcuts">
        <Link href="/" className="active"><HomeIcon /> Landing</Link>
        <Link href="/browse"><GridIcon /> Browse</Link>
        <Link href="/browse"><DocumentIcon /> Detail</Link>
      </nav>
    </main>
  );
}
