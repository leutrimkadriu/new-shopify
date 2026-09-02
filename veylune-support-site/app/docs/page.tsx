import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { docs } from './content';

export const metadata: Metadata = { title:'Documentation', description:'Official merchant guide for installing, customizing, and managing the Veylune theme.' };
const groups = [...new Set(docs.map((entry) => entry.group))];

export default function DocsPage() {
  return <>
    <a className="skip-link" href="#main-content">Skip to documentation</a><SiteHeader />
    <main id="main-content">
      <section className="docs-hero"><div><p className="eyebrow">Merchant guide · Version 2.0.5</p><h1>Build with<br />clarity.</h1></div><div className="hero-intro"><p>Everything you need to install, customize, and operate Veylune—an editorial commerce theme for Shopify Online Store 2.0.</p><Link className="text-link" href="/support">Need help? Contact support <span aria-hidden="true">↗</span></Link></div></section>
      <div className="docs-shell">
        <aside className="docs-sidebar" aria-label="Documentation contents"><p className="eyebrow">On this page</p>{groups.map(group=><div className="toc-group" key={group}><strong>{group}</strong><ul>{docs.filter(entry=>entry.group===group).map(entry=><li key={entry.id}><a href={`#${entry.id}`}>{entry.title}</a></li>)}</ul></div>)}</aside>
        <article className="docs-content">
          <header className="guide-header"><p className="eyebrow">Complete guide</p><h2>From installation to daily operation</h2><p>This guide documents controls and behavior included in Veylune 2.0.5. Platform features and third-party apps remain subject to their own configuration and availability.</p></header>
          {docs.map((entry,index)=><section className="doc-entry" id={entry.id} key={entry.id}><div className="doc-number">{String(index+1).padStart(2,'0')}</div><div><p className="entry-group">{entry.group}</p><h2>{entry.title}</h2><p className="entry-intro">{entry.intro}</p><ul>{entry.details.map(detail=><li key={detail}>{detail}</li>)}</ul>{entry.note&&<aside className="doc-note"><strong>Good to know</strong><p>{entry.note}</p></aside>}<a className="back-top" href="#main-content">Back to top ↑</a></div></section>)}
          <section className="docs-cta"><p className="eyebrow">Merchant support</p><h2>Still need a hand?</h2><p>Send the affected store URL, reproduction steps, and browser/device details so the issue can be investigated efficiently.</p><Link className="button" href="/support">Contact Veylune support</Link></section>
        </article>
      </div>
    </main><SiteFooter />
  </>;
}
