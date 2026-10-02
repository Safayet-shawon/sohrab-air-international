"use client";
import { useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2, Lock, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminControlCenter } from "@/admin/control-center";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminSecurityGate({displayName}:{displayName:string}) {
  const [mode,setMode]=useState<"checking"|"login"|"ready">("checking");
  const [message,setMessage]=useState("");
  const check=useCallback(async()=>{
    setMode("checking");
    try {
      const response=await fetch("/api/admin/overview",{cache:"no-store"});
      if(response.ok){setMode("ready");return}
      const data=await response.json();
      setMessage(data.error||"Admin login required");
    } catch {setMessage("Backend unavailable. Please try again.");}
    setMode("login");
  },[]);
  useEffect(()=>{const timer=setTimeout(()=>{void check()},0);return()=>clearTimeout(timer)},[check]);
  if(mode==="checking")return <div className="admin-loading"><Loader2 className="animate-spin"/>Security check…</div>;
  if(mode==="login")return <LoginForm message={message} onDone={check}/>;
  return <div className="grid gap-4"><div className="security-toolbar"><span><ShieldCheck/>Protected admin session</span><Button variant="outline" onClick={async()=>{await fetch("/api/admin/logout",{method:"POST"});setMode("login")}}><LogOut/>Lock panel</Button></div><AdminControlCenter displayName={displayName}/></div>;
}
function LoginForm({message,onDone}:{message:string;onDone:()=>void}) {
  const [loginId,setLoginId]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(message);
  async function submit(event:React.FormEvent) {
    event.preventDefault();setBusy(true);
    try {
      const response=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({loginId,password})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Login failed");
      toast.success("Admin panel unlocked");onDone();
    } catch(e){setError(e instanceof Error?e.message:"Login failed");}
    finally{setBusy(false);}
  }
  return <form className="admin-card security-card" onSubmit={submit}><KeyRound/><span className="eyebrow">Administration</span><h2>Admin login</h2><p>Enter your Admin ID and password.</p><label>Admin ID<Input value={loginId} onChange={e=>setLoginId(e.target.value)} autoComplete="username" required/></label><label>Password<Input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>{error&&<p className="security-error">{error}</p>}<Button disabled={busy}>{busy?<Loader2 className="animate-spin"/>:<Lock/>}Unlock admin panel</Button></form>;
}
