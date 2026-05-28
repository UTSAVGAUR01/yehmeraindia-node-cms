import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Shield } from 'lucide-react';
import { MediaPostComposer } from '../components/MediaPostComposer';
import { PostDirectory } from '../components/PostDirectory';

const data = Array.from({ length: 10 }, (_, i) => ({ day: `D${i + 1}`, views: 300 + i * 120 }));

export function AdminDashboard() {
  return <main className="mx-auto max-w-7xl px-6 py-32"><div className="flex items-end justify-between"><div><p className="text-xs uppercase tracking-[0.5em] text-saffron">Control Room</p><h1 className="mt-3 font-display text-6xl">Admin <span className="text-saffron">Dashboard</span></h1></div><Shield className="hidden h-12 w-12 text-saffron md:block"/></div><div className="mt-8 grid gap-4 md:grid-cols-5">{['Users','Articles','Views','Comments','Today Views'].map(x=><div className="card p-5" key={x}><div className="font-display text-4xl">0</div><div className="text-xs uppercase tracking-widest text-saffron">{x}</div></div>)}</div><section className="card mt-8 p-5"><h2 className="mb-4 font-display text-3xl">Traffic Trend</h2><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><XAxis dataKey="day"/><YAxis/><Line type="monotone" dataKey="views" stroke="#FF6600" strokeWidth={3}/></LineChart></ResponsiveContainer></div></section><div className="mt-8 grid gap-8"><MediaPostComposer adminMode /><PostDirectory adminMode /></div></main>;
}
