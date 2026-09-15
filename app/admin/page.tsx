import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AdminDashboard } from "@/components/admin-dashboard";
export const dynamic="force-dynamic";
export default async function Admin(){const user=await requireChatGPTUser('/admin');return <div className="page"><section className="section"><AdminDashboard displayName={user.displayName}/></section></div>}
