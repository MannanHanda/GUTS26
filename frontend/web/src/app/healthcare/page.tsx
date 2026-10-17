import Link from 'next/link';
import { ExternalLink, Phone, TriangleAlert } from 'lucide-react';

// Official sources named in the healthcare handoff. Each one needs a check before release.
const OFFICIAL_SOURCES = [
  { label: 'NHS inform (Scotland)', url: 'https://www.nhsinform.scot/' },
  { label: 'NHS Greater Glasgow and Clyde', url: 'https://www.nhsggc.scot/' },
  { label: 'NHS 24', url: 'https://www.nhs24.scot/' },
  { label: 'GOV.UK: Immigration Health Surcharge', url: 'https://www.gov.uk/healthcare-immigration-application' },
];

const EMERGENCY_NUMBERS = [
  { number: '999', service: 'Ambulance, fire, police', use: 'Life-threatening emergencies and immediate danger.' },
  { number: '111', service: 'NHS 24', use: 'Urgent care that is not life-threatening, out-of-hours advice and mental health support.' },
  { number: '101', service: 'Police Scotland', use: 'Non-emergency police matters.' },
];

export default function HealthcarePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
              Healthcare Module
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">Healthcare in Glasgow</h1>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition self-start"
          >
            Back to Dashboard
          </Link>
        </div>

        <div role="note" className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Clinic and cost information is not available yet</p>
            <p>
              We have not yet verified Glasgow clinic listings, opening hours, NHS charges or the health surcharge
              figures from official sources, so this page does not show them. This is guidance, not medical advice.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="font-bold text-slate-900 text-sm">Emergency numbers</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EMERGENCY_NUMBERS.map((item) => (
              <li key={item.number} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
                <a href={`tel:${item.number}`} className="inline-flex items-center gap-2 text-2xl font-extrabold text-slate-900">
                  <Phone className="w-5 h-5" /> {item.number}
                </a>
                <div className="text-xs font-bold text-slate-800">{item.service}</div>
                <p className="text-xs text-slate-600">{item.use}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">If you are in danger, call 999 now. Do not wait for this app.</p>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-slate-900 text-sm">Official sources</h2>
          <ul className="space-y-2 text-xs">
            {OFFICIAL_SOURCES.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-800 underline underline-offset-2"
                >
                  {source.label} <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
