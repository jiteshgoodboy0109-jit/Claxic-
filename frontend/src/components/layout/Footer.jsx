import React from 'react';
import {
  GraduationCap,
  Shield,
  Mail,
  Phone,
  MapPin,
  Globe,
  ArrowUpRight,
} from 'lucide-react';

export const Footer = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-white text-slate-900 flex items-center justify-center font-bold text-lg">
                C
              </div>
              <div>
                <span className="font-display text-xl font-extrabold tracking-wider text-white block uppercase">
                  CLAXIC
                </span>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block font-medium">
                  Academic Admissions Portal
                </span>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed max-w-md font-normal text-xs">
              Claxic delivers accredited engineering programs, distributed systems masterclasses, and executive cohorts designed for real-world production scale.
            </p>

            <div className="flex items-center gap-3 text-slate-300">
              <a
                href="https://claxic.edu"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 rounded-md bg-slate-800 border border-slate-700 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-2 text-xs font-mono"
                aria-label="Website"
              >
                <Globe className="w-3.5 h-3.5 text-slate-300" />
                <span>Portal</span>
              </a>
              <a
                href="mailto:admissions@claxic.edu"
                className="px-3 py-1 rounded-md bg-slate-800 border border-slate-700 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-2 text-xs font-mono"
                aria-label="Email"
              >
                <Mail className="w-3.5 h-3.5 text-slate-300" />
                <span>Email Support</span>
              </a>
            </div>
          </div>

          {/* Column 2: Programs */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              Academic Tracks
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('courses')} className="hover:text-white transition-colors">
                  AI & Full-Stack Systems
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('courses')} className="hover:text-white transition-colors">
                  Cloud DevOps & Kubernetes
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('courses')} className="hover:text-white transition-colors">
                  Distributed Architecture
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('courses')} className="hover:text-white transition-colors">
                  Cybersecurity & Red Teaming
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              Platform & Policy
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
                  Admissions Criteria
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
                  7-Day Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
                  Verifiable Certification
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin-login')}
                  className="text-amber-400/80 hover:text-amber-300 font-mono text-[11px] transition-colors flex items-center gap-1 mt-2"
                >
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>Admin Gateway</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              Headquarters
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Sector 4, Ring Road, Bengaluru, 560103</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>admissions@claxic.edu</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Claxic Institute of Advanced Technology. All rights reserved.</p>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>CIN: U80903KA2026PTC192842</span>
            <span>GSTIN: 29AAACC1206A1Z5</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
