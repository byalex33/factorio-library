import Link from "next/link";

const categories = [
  { name: "Smelting", detail: "Furnaces & foundries", icon: "♨" },
  { name: "Trains", detail: "Stations & networks", icon: "▰" },
  { name: "Circuits", detail: "Logic & displays", icon: "⌁" },
  { name: "Science", detail: "Labs & production", icon: "⬡" },
  { name: "Power", detail: "Nuclear & solar", icon: "ϟ" },
];

const stats = [
  { value: 12480, display: "12,480", label: "blueprints" },
  { value: 2300000, display: "2.3M", label: "copies" },
  { value: 14, display: "14", label: "categories" },
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

export default function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-glow" />

        <div className="hero-content">
          <p className="hero-kicker">
            <span aria-hidden="true">〽</span>
            Community blueprint archive
          </p>

          <h1 className="hero-title">
            <span>Find and share</span>
            <span>
              <strong>Factorio</strong> blueprints
            </span>
          </h1>

          <p className="hero-description">
            Browse community-made builds for smelting, trains, circuits, science, power,
            <br className="hidden sm:block" /> Space Age, and more.
          </p>

          <form action="/browse" className="hero-search">
            <SearchIcon />
            <input
              type="search"
              name="q"
              aria-label="Search blueprints"
              placeholder="Search blueprints — e.g. ‘red science 60/min’, ‘nuclear’, ‘balancer’"
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

          <dl className="hero-stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt>
                  <data value={stat.value}>{stat.display}</data>
                </dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="category-section" aria-labelledby="category-heading">
        <div className="category-heading-row">
          <h2 id="category-heading">Browse by category</h2>
          <Link href="/browse">
            All categories <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <Link key={category.name} href="/browse" className="category-card">
              <span className="category-icon" aria-hidden="true">
                {category.icon}
              </span>
              <span>
                <strong>{category.name}</strong>
                <small>{category.detail}</small>
              </span>
              <span className="category-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
