import { env } from 'cloudflare:workers';

const createTable=`CREATE TABLE IF NOT EXISTS support_requests (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  store_url TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL
)`;
const createIndex=`CREATE INDEX IF NOT EXISTS idx_support_requests_status_created_at ON support_requests(status, created_at)`;

export async function saveSupportRequest(input:{name:string;email:string;storeUrl:string;subject:string;message:string}){
  const db=env.DB;
  await db.batch([db.prepare(createTable),db.prepare(createIndex)]);
  const id=crypto.randomUUID(); const createdAt=new Date().toISOString();
  await db.prepare(`INSERT INTO support_requests (id,name,email,store_url,subject,message,status,created_at) VALUES (?,?,?,?,?,?,'new',?)`).bind(id,input.name,input.email,input.storeUrl,input.subject,input.message,createdAt).run();
  return {id,createdAt};
}
