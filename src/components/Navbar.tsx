import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { isSafeUrl } from '../utils/skillsLogic';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const { settings } = useCms();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNavClick = (e: React.MouseEvent, target: string) => {
    e.preventDefault();
    setMobileOpen(false);
    if (target.startsWith('#')) {
      if (currentPath !== '/') {
        onNavigate('/');
        setTimeout(() => {
          document.getElementById(target.slice(1))?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      } else {
        document.getElementById(target.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    if (target.startsWith('http')) {
      if (isSafeUrl(target)) window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }
    onNavigate(target);
  };

  const navItems = [
    { label: 'Skills Library', href: '#skills-library' },
    { label: 'Updates', href: '/updates' },
    { label: 'About', href: '/about' },
    { label: 'Get in Touch', href: '/contact' },
  ];

  const ctaTarget = isSafeUrl(settings.announcementLink)
    ? settings.announcementLink || '/updates'
    : '/updates';

  return (
    <header className="sticky top-0 z-40 bg-[#F5F5FA] border-b border-[#18264F]/8">
      <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <a
          href="/"
          onClick={(e) => handleNavClick(e, '/')}
          className="font-display text-2xl font-bold tracking-tight text-[#18264F] whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity"
        >
          {settings.logoText || 'Lakshya'}
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#18264F]/75"
        >
          {navItems.map((item) => {
            const isActive =
              item.href !== '#skills-library' &&
              (currentPath === item.href || currentPath.startsWith(`${item.href}/`));
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#18264F] hover:underline underline-offset-4 ${
                  isActive ? 'text-[#18264F] underline underline-offset-4' : ''
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single primary announcement CTA + mobile trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={ctaTarget}
            onClick={(e) => handleNavClick(e, ctaTarget)}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#F2A77F] text-[#18264F] text-xs font-semibold hover:bg-[#eab190] transition-colors whitespace-nowrap shrink-0"
          >
            Get the AI Brief
          </a>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border border-[#18264F]/12 bg-white text-[#18264F]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#18264F]/10 px-6 py-5 space-y-3">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="block py-2 text-base font-medium text-[#18264F] hover:text-[#304A96]"
            >
              {item.label}
            </a>
          ))}
          <a
            href={ctaTarget}
            onClick={(e) => handleNavClick(e, ctaTarget)}
            className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-[#F2A77F] text-[#18264F] text-sm font-semibold"
          >
            Get the AI Brief
          </a>
        </div>
      )}
    </header>
  );
}
