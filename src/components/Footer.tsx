import { useCms } from '../context/CmsContext';
import { isSafeUrl } from '../utils/skillsLogic';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { settings, homepage } = useCms();

  const handleInternal = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#18264F]/10 bg-white mt-20">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-3">
            <a
              href="/"
              onClick={(e) => handleInternal(e, '/')}
              className="font-display text-2xl font-bold text-[#18264F] inline-block"
            >
              {settings.logoText || 'Lakshya'}
            </a>
            <p className="text-sm text-[#18264F]/70 leading-relaxed max-w-sm">
              {homepage.footerDescription}
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-[#18264F]">Explore</h3>
            <ul className="space-y-2 text-sm text-[#18264F]/75">
              <li>
                <a href="/" onClick={(e) => handleInternal(e, '/')} className="hover:text-[#304A96]">
                  Home
                </a>
              </li>
              <li>
                <a href="/updates" onClick={(e) => handleInternal(e, '/updates')} className="hover:text-[#304A96]">
                  Updates &amp; Articles
                </a>
              </li>
              <li>
                <a href="/about" onClick={(e) => handleInternal(e, '/about')} className="hover:text-[#304A96]">
                  About
                </a>
              </li>
              <li>
                <a href="/contact" onClick={(e) => handleInternal(e, '/contact')} className="hover:text-[#304A96]">
                  Get in Touch
                </a>
              </li>
              <li>
                <a href="/admin" onClick={(e) => handleInternal(e, '/admin')} className="hover:text-[#304A96]">
                  Creator CMS
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#18264F]">Connect</h3>
            <ul className="space-y-2 text-sm text-[#18264F]/75">
              {settings.socialLinks.map((soc) => {
                const safeHref = isSafeUrl(soc.url) ? soc.url : '#';
                return (
                  <li key={soc.id}>
                    <a
                      href={safeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#304A96]"
                    >
                      {soc.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#18264F]/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#18264F]/60">
          <p>© {new Date().getFullYear()} {settings.siteName || 'Lakshya'}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="/privacy" onClick={(e) => handleInternal(e, '/privacy')} className="hover:text-[#18264F]">
              Privacy Policy
            </a>
            <a href="/terms" onClick={(e) => handleInternal(e, '/terms')} className="hover:text-[#18264F]">
              Terms and Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
