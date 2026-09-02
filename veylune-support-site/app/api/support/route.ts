import { NextResponse } from 'next/server';
import { saveSupportRequest } from '../../../db/support';

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';

export async function POST(request:Request){
  try{
    const body=await request.json() as Record<string,unknown>;
    if(clean(body.website,100)) return NextResponse.json({message:'Request received.'},{status:201});
    const name=clean(body.name,120),email=clean(body.email,254).toLowerCase(),storeUrl=clean(body.storeUrl,500),subject=clean(body.subject,180),message=clean(body.message,6000);
    if(!name||!emailPattern.test(email)||!storeUrl||!subject||message.length<20) return NextResponse.json({message:'Please complete every field with valid information.'},{status:400});
    let normalizedStoreUrl:string;
    try{const url=new URL(storeUrl);if(!['http:','https:'].includes(url.protocol)||!url.hostname.includes('.'))throw new Error();url.hash='';normalizedStoreUrl=url.toString();}
    catch{return NextResponse.json({message:'Enter a complete store URL beginning with https://.'},{status:400});}
    const saved=await saveSupportRequest({name,email,storeUrl:normalizedStoreUrl,subject,message});
    return NextResponse.json({message:'Your support request has been stored.',reference:saved.id.slice(0,8).toUpperCase()},{status:201});
  }catch(error){console.error('Support request failed',error);return NextResponse.json({message:'Support is temporarily unavailable. Please try again.'},{status:500});}
}
