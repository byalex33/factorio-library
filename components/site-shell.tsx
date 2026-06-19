import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { getUserHandle } from "@/lib/users";

const navItems = [
  { href: "/browse", label: "Browse" },
  { href: "/upload", label: "Upload" },
];

function CubeMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 42 42" className="size-8 fill-none stroke-current" strokeWidth="2.2">
      <path d="m21 5 8 4.5v9L21 23l-8-4.5v-9L21 5Z" strokeLinejoin="round" />
      <path d="m13 9.5 8 4.5 8-4.5M21 14v9" strokeLinejoin="round" />
      <path d="m12.5 18 8 4.5v9l-8 4.5-8-4.5v-9l8-4.5Z" strokeLinejoin="round" />
      <path d="m4.5 22.5 8 4.5 8-4.5M12.5 27v9" strokeLinejoin="round" />
      <path d="m29.5 18 8 4.5v9l-8 4.5-8-4.5v-9l8-4.5Z" strokeLinejoin="round" />
      <path d="m21.5 22.5 8 4.5 8-4.5M29.5 27v9" strokeLinejoin="round" />
    </svg>
  );
}

function SignInIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2">
      <path d="M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="site-logo" aria-label="Factorio Library home">
      <span className="site-logo-mark">
        <CubeMark />
      </span>
      <span className="site-logo-type">
        Factorio <strong>Library</strong>
      </span>
    </Link>
  );
}

export async function SiteHeader() {
  const user = await currentUser();
  const handle = getUserHandle(user);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="site-header-left">
          <Logo />
          <nav aria-label="Main navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="site-auth">
          {user ? (
            <>
              {handle ? (
                <Link href={`/u/${handle.slice(1)}`} className="user-handle">
                  {handle}
                </Link>
              ) : null}
              <UserButton userProfileMode="navigation" userProfileUrl="/account" />
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="sign-in-button">
                <SignInIcon />
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Logo />
        <p>Unofficial community project. Not affiliated with Wube Software.</p>
      </div>
      <div className="flex flex-wrap gap-5">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link href="/about">About</Link>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 sm:py-14">{children}</main>;
}
