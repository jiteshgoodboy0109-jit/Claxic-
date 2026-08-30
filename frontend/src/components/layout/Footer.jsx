import React from 'react';
import { Mail, MapPin, ArrowUpRight } from 'lucide-react';

export const Footer = ({ onNavigate }) => {
  return (
    <footer className="bg-[#083E40] border-t border-[#0e5254] text-teal-100/75 text-sm font-sans relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-8 sm:pb-10 border-b border-[#0e5254]">
          
          {/* Brand & Mission */}
          <div className="space-y-3 sm:space-y-4">
            <img
              src="/logow.png"
              alt="Claxic"
              className="h-7 sm:h-8 w-auto object-contain"
            />
            <p className="text-xs text-teal-100/80 leading-relaxed max-w-sm">
              Empowering engineers and tech professionals through rigorous hands-on cohorts, modern system architecture, and verifiable certifications.
            </p>
          </div>

          {/* Programs */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Programs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('courses')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  AI & Full-Stack Systems
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('courses')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Cloud DevOps & SRE
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('courses')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Distributed Architecture
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('courses')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Cybersecurity Engineering
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('courses')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Explore Courses
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('home')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Admissions Application
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('login')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Student Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Contact & Campus
            </h4>
            <div className="space-y-2.5 text-xs">
              <p className="flex items-start gap-2 text-teal-100/80">
                <MapPin className="w-3.5 h-3.5 text-teal-300 shrink-0 mt-0.5" />
                <span>Sector 4, Outer Ring Road, Bengaluru, Karnataka, India</span>
              </p>
              <p className="flex items-center gap-2 text-teal-100/80">
                <Mail className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                <a
                  href="mailto:admissions@claxic.edu"
                  className="hover:text-white transition-colors"
                >
                  admissions@claxic.edu
                </a>
              </p>
            </div>
          </div>

        </div>

        {/* Clean Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-teal-100/60">
          <p>© {new Date().getFullYear()} Claxic. All rights reserved.</p>
          <div className="flex items-center gap-4 sm:gap-6 text-[11px]">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('home')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('home')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('home')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Refund Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
