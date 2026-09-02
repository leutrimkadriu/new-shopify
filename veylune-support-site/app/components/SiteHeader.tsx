import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/docs" aria-label="Veylune documentation home">
        VEYLUNE
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link href="/docs">Documentation</Link>
        <Link className="support-link" href="/support">Get support</Link>
      </nav>
    </header>
  );
}
