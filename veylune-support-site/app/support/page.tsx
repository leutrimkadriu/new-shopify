import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { SupportForm } from './SupportForm';

export const metadata:Metadata={title:'Theme Support',description:'Contact Veylune theme support and send a detailed merchant support request.'};
export default function SupportPage(){return <>
  <a className="skip-link" href="#main-content">Skip to support</a><SiteHeader />
  <main id="main-content" className="support-page">
    <section className="support-hero"><div><p className="eyebrow">Veylune theme support</p><h1>Tell us what<br />is happening.</h1></div><div className="support-intro"><p>Send a focused report and we’ll have the context needed to investigate your Veylune theme issue.</p><Link className="text-link" href="/docs">Read the documentation <span aria-hidden="true">↗</span></Link></div></section>
    <section className="support-layout" aria-labelledby="request-title">
      <div className="support-guidance"><p className="eyebrow">Before you send</p><h2 id="request-title">A useful request gets to the answer faster.</h2><div className="guidance-list">
        <article><span>01</span><div><h3>Check the guide</h3><p>Review the relevant setup and troubleshooting steps in the <Link href="/docs">Veylune documentation</Link>.</p></div></article>
        <article><span>02</span><div><h3>Test a clean copy</h3><p>When possible, reproduce the issue in an unmodified duplicate with browser extensions disabled.</p></div></article>
        <article><span>03</span><div><h3>Include evidence</h3><p>Share the affected URL, exact steps, expected and actual results, version, and browser/device.</p></div></article>
      </div><aside className="privacy-note"><strong>Protect your store</strong><p>Never submit passwords, API keys, payment details, customer data, or private tokens. Requests are stored so they can be reviewed and answered.</p></aside></div>
      <div className="form-panel"><header><p className="eyebrow">Support request</p><h2>How can we help?</h2></header><SupportForm /></div>
    </section>
    <section className="support-scope"><article><p className="eyebrow">Covered</p><h2>Theme support</h2><ul><li>Confirmed issues in unmodified Veylune theme code</li><li>Guidance using built-in settings, sections, and blocks</li><li>Clarification of documented Veylune behavior</li></ul></article><article><p className="eyebrow">Usually outside scope</p><h2>Additional services</h2><ul><li>Custom feature development or redesign work</li><li>Third-party app setup or debugging</li><li>Catalog, market, shipping, tax, payment, or account administration</li></ul></article></section>
  </main><SiteFooter />
</>}
