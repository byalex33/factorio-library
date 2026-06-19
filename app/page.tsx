import Link from "next/link";
import { HomeArchiveStatus } from "@/components/home-archive-status";
import { HomeRecentBlueprints } from "@/components/home-recent-blueprints";

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

          <HomeArchiveStatus />
        </div>
      </section>

      <HomeRecentBlueprints />
    </main>
  );
}
