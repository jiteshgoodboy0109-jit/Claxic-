import React from 'react';
import { Mail } from 'lucide-react';

export const Footer = ({ onNavigate }) => {
  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com',
      hoverColor: 'hover:text-[#0a66c2] hover:border-[#0a66c2]/50 hover:bg-[#0a66c2]/10',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63-.73-1.63-1.63-1.63Z" />
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      href: 'https://twitter.com',
      hoverColor: 'hover:text-[#1da1f2] hover:border-[#1da1f2]/50 hover:bg-[#1da1f2]/10',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: 'https://github.com',
      hoverColor: 'hover:text-white hover:border-white/50 hover:bg-white/10',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com',
      hoverColor: 'hover:text-[#ff0000] hover:border-[#ff0000]/50 hover:bg-[#ff0000]/10',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="m10 15 5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73Z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com',
      hoverColor: 'hover:text-[#e4405f] hover:border-[#e4405f]/50 hover:bg-[#e4405f]/10',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-[#083E40] border-t border-[#0e5254] text-teal-100/75 text-sm font-sans relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Main 3-Column Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-[#0e5254] items-start">
          
          {/* Column 1: Brand Logo */}
          <div className="md:col-span-4 lg:col-span-5 flex items-start">
            <img
              src="/logow.png"
              alt="Claxic"
              className="h-7 sm:h-8 w-auto object-contain cursor-pointer transition-opacity hover:opacity-90"
              onClick={() => onNavigate && onNavigate('home')}
            />
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-4 lg:col-span-3 space-y-3">
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
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('staff-login')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Staff & Faculty Portal
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('admin-login')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Admin Console
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Support */}
          <div className="md:col-span-4 lg:col-span-4 space-y-3.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Contact & Support
            </h4>
            
            {/* Email Link */}
            <div>
              <a
                href="mailto:support.claxic@gmail.com"
                className="inline-flex items-center gap-2.5 text-xs text-teal-100/80 hover:text-white transition-colors group"
              >
                <div className="w-6 h-6 rounded-md bg-teal-900/60 border border-teal-700/50 flex items-center justify-center text-teal-300 group-hover:text-white group-hover:border-teal-400 transition-colors shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>support.claxic@gmail.com</span>
              </a>
            </div>

            {/* Social Media Links */}
            <div className="pt-1 space-y-2">
              <p className="text-[11px] font-medium text-teal-200/70">Follow our community</p>
              <div className="flex items-center flex-wrap gap-2">
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.name}
                    className={`w-8 h-8 rounded-lg bg-teal-900/50 border border-teal-700/60 flex items-center justify-center text-teal-200/90 transition-all duration-200 hover:-translate-y-0.5 shadow-xs cursor-pointer ${item.hoverColor}`}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Clean Bottom Bar */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-teal-100/60">
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
