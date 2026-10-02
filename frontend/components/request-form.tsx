"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { B } from "@/components/bilingual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Field = { name: string; bn: string; en: string; type?: string; required?: boolean; placeholder?: string };
export function RequestForm({ type, titleBn, titleEn, fields, passport=false }: { type: string; titleBn: string; titleEn: string; fields: Field[]; passport?: boolean }) {
  const [busy,setBusy]=useState(false),[reference,setReference]=useState("");
  async function submit(event: FormEvent<HTMLFormElement>){event.preventDefault();const element=event.currentTarget;setBusy(true);const form=new FormData(element);form.set("type",type);try{const res=await fetch("/api/submissions",{method:"POST",body:form});const data=await res.json();if(!res.ok)throw new Error(data.error||"Request failed");setReference(data.reference);element.reset();toast.success("অনুরোধ সংরক্ষণ হয়েছে")}catch(error){toast.error(error instanceof Error?error.message:"অনুরোধ সংরক্ষণ হয়নি")}finally{setBusy(false)}}
  if(reference)return <div className="success-card"><ShieldCheck/><h3><B bn="অনুরোধ সফলভাবে সংরক্ষণ হয়েছে" en="Request saved successfully"/></h3><p><B bn="আমাদের প্রতিনিধি আপনাকে কল করবেন।" en="Our representative will call you."/></p><strong>{reference}</strong><Button variant="outline" onClick={()=>setReference("")}><B bn="নতুন অনুরোধ" en="New request"/></Button></div>;
  return <form onSubmit={submit} className="request-form"><div><span className="eyebrow"><B bn="নিরাপদ অনলাইন ফর্ম" en="Secure online form"/></span><h2><B bn={titleBn} en={titleEn}/></h2></div><div className="form-grid"><label><span><B bn="পূর্ণ নাম" en="Full name"/> *</span><Input name="name" required maxLength={120}/></label><label><span><B bn="মোবাইল নম্বর" en="Mobile number"/> *</span><Input name="phone" type="tel" required pattern="[+0-9 ]{9,15}"/></label><label><span>Email</span><Input name="email" type="email" maxLength={160}/></label>{fields.map(field=><label key={field.name} className={field.type==="textarea"?"wide":""}><span><B bn={field.bn} en={field.en}/>{field.required?" *":""}</span>{field.type==="textarea"?<Textarea name={field.name} required={field.required} maxLength={1000}/>:<Input name={field.name} type={field.type||"text"} required={field.required} placeholder={field.placeholder} maxLength={500}/>}</label>)}{passport&&<label className="wide"><span><B bn="Passport-এর ছবি (JPG/PNG, সর্বোচ্চ ৫ MB)" en="Passport image (JPG/PNG, up to 5 MB)"/></span><Input name="passport" type="file" accept="image/jpeg,image/png,image/webp"/></label>}</div><Button disabled={busy} className="w-full bg-[#0e4b3e] py-6 text-base">{busy&&<Loader2 className="animate-spin"/>}<B bn="অনুরোধ জমা দিন" en="Submit request"/></Button><p className="privacy-note"><ShieldCheck/><B bn="তথ্য encrypted connection-এ পাঠানো ও নিরাপদ storage-এ সংরক্ষণ করা হয়।" en="Data is sent over an encrypted connection and stored securely."/></p></form>;
}
