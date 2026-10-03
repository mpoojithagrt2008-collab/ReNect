import { Recycle, Package, Repeat, IndianRupee, Leaf, TrendingDown, Info } from 'lucide-react';
import type { Page } from '../components/Navigation';

interface Props {
  navigate: (p: Page) => void;
}

interface StatCardProps {
  icon: typeof Recycle;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  sublabel?: string;
}

function StatCard({ icon: Icon, iconBg, iconColor, value, label, sublabel }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md">
      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
      {sublabel && <p className="mt-0.5 text-[10px] text-gray-400">{sublabel}</p>}
    </div>
  );
}

function ImpactBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Sustainability({ navigate }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-lg shadow-emerald-200/50 md:p-8">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-50/90">
          <Leaf className="h-4 w-4" />
          Sustainability
        </div>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight md:text-3xl">
          ReNect Reuse Impact
        </h1>
        <p className="mt-1.5 text-sm text-emerald-50/80 md:text-base">
          Every item borrowed is one less item bought. Together, the campus community is reducing waste and saving money.
        </p>
      </div>

      {/* Demo stats */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <Info className="h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs text-amber-700">
          These are <span className="font-semibold">demo statistics</span> for illustration purposes. They would be dynamically calculated based on real platform activity in production.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Package}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          value="248"
          label="Items Reused"
          sublabel="Across campus"
        />
        <StatCard
          icon={Repeat}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          value="173"
          label="Successful Exchanges"
          sublabel="Borrower to owner"
        />
        <StatCard
          icon={IndianRupee}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
          value="₹42,600"
          label="Estimated Money Saved"
          sublabel="vs. buying new"
        />
        <StatCard
          icon={Recycle}
          iconBg="bg-lime-50"
          iconColor="text-lime-600"
          value="89%"
          label="Reuse Impact"
          sublabel="Items kept in circulation"
        />
      </div>

      {/* Impact breakdown */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <TrendingDown className="h-4.5 w-4.5 text-emerald-600" />
          Impact Breakdown
        </h2>
        <div className="space-y-4">
          <ImpactBar label="Items reused instead of purchased" value={248} max={300} color="bg-emerald-500" />
          <ImpactBar label="Exchanges completed successfully" value={173} max={200} color="bg-teal-500" />
          <ImpactBar label="Students participating" value={86} max={100} color="bg-cyan-500" />
          <ImpactBar label="Avg. cost reduction per student" value={72} max={100} color="bg-lime-500" />
        </div>
      </div>

      {/* Category impact */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Impact by Category</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { category: 'Books', count: 67, saved: '₹18,200' },
            { category: 'Calculators', count: 34, saved: '₹6,800' },
            { category: 'Electronics', count: 28, saved: '₹9,400' },
            { category: 'Cycles', count: 19, saved: '₹4,200' },
            { category: 'Lab Equipment', count: 52, saved: '₹3,100' },
            { category: 'Sports', count: 12, saved: '₹900' },
          ].map((cat) => (
            <div key={cat.category} className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
              <p className="text-sm font-semibold text-gray-900">{cat.category}</p>
              <p className="mt-1 text-xs text-gray-500">{cat.count} items reused</p>
              <p className="mt-0.5 text-xs font-medium text-emerald-600">{cat.saved} saved</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-center">
        <Recycle className="mb-2 h-8 w-8 text-emerald-500" />
        <p className="text-sm font-medium text-gray-700">Want to contribute to campus sustainability?</p>
        <p className="mt-0.5 text-xs text-gray-500">List items you no longer need or borrow instead of buying.</p>
        <button
          onClick={() => navigate('items')}
          className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98]"
        >
          List an Item
        </button>
      </div>
    </div>
  );
}
