import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div><Link className="wordmark" href="/docs">VEYLUNE</Link><p>Independent theme documentation and merchant support.</p></div>
      <nav aria-label="Footer navigation"><Link href="/docs">Documentation</Link><Link href="/support">Support</Link></nav>
      <p className="legal-note">Veylune is an independent theme and is not endorsed by or affiliated with Shopify.</p>
    </footer>
  );
}
