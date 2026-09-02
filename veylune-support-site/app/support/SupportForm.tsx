'use client';
import { FormEvent, useState } from 'react';

type FormStatus = { kind:'idle'|'sending'|'success'|'error'; message?:string };

export function SupportForm() {
  const [status,setStatus]=useState<FormStatus>({kind:'idle'});
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=event.currentTarget;
    setStatus({kind:'sending',message:'Sending your request…'});
    try {
      const response=await fetch('/api/support',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))});
      const result=await response.json() as {message?:string;reference?:string};
      if(!response.ok) throw new Error(result.message||'Your request could not be sent.');
      form.reset(); setStatus({kind:'success',message:`Request received. Your reference is ${result.reference}.`});
    } catch(error) { setStatus({kind:'error',message:error instanceof Error?error.message:'Your request could not be sent.'}); }
  }
  return <form className="support-form" onSubmit={submit}>
    <div className="form-row"><div className="field"><label htmlFor="support-name">Name</label><input id="support-name" name="name" autoComplete="name" maxLength={120} required /></div><div className="field"><label htmlFor="support-email">Email</label><input id="support-email" name="email" type="email" autoComplete="email" maxLength={254} required /></div></div>
    <div className="field"><label htmlFor="support-store">Shopify store URL</label><input id="support-store" name="storeUrl" type="url" inputMode="url" autoComplete="url" placeholder="https://your-store.myshopify.com" maxLength={500} required /><span>Use your public storefront or myshopify.com URL.</span></div>
    <div className="field"><label htmlFor="support-subject">Subject</label><input id="support-subject" name="subject" maxLength={180} required /></div>
    <div className="field"><label htmlFor="support-message">Message</label><textarea id="support-message" name="message" rows={9} minLength={20} maxLength={6000} required /><span>Include Veylune version, affected page, steps, expected result, and browser/device.</span></div>
    <div className="honeypot" aria-hidden="true"><label htmlFor="support-website">Website</label><input id="support-website" name="website" tabIndex={-1} autoComplete="off" /></div>
    <button className="button submit-button" type="submit" disabled={status.kind==='sending'}>{status.kind==='sending'?'Sending…':'Send support request'}</button>
    <div className={`form-status ${status.kind}`} role="status" aria-live="polite">{status.message}</div>
  </form>;
}
