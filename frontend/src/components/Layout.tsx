"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { normalizeLang, SUPPORTED_LANGS } from "@/lib/lang";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import ListYourBusinessModal from "./ListYourBusinessModal";
import { useModal } from "@/hooks/useModal";

type LayoutProps = {
  children: ReactNode;
  headerExtra?: ReactNode;
  headerVariant?: "overlay" | "solid";
};

export default function Layout({ children, headerExtra, headerVariant = "solid" }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modal state
  const listBusinessModal = useModal();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 0);
    }

    onScroll(); // initialize
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // pathname example: "/en/search" or "/nl/blog/xyz"
  const segments = pathname.split("/").filter(Boolean); // ["en", "search"]
  const currentLang = normalizeLang(String(params?.lang || "en"));

  function changeLang(newLang: string) {
    const newSegments = [...segments];
    if (!newSegments.length) {
      newSegments.push(newLang);
    } else {
      newSegments[0] = newLang;
    }
    const newPath = "/" + newSegments.join("/");
    router.push(newPath);
  }

  // Navigation items (Search and Locations hidden for preview)
  const navItems = [
    { href: `/${currentLang}`, label: "Home" },
    { href: `/${currentLang}/countries`, label: "Countries" },
    { href: `/${currentLang}/cities`, label: "Cities" },
    { href: `/${currentLang}/blog`, label: "Blog" },
  ];

  // Determine navbar appearance based on headerVariant and scroll
  const useOverlayNavbar = headerVariant === "overlay" && !scrolled;
  
  // Check if this is an inner page (not homepage)
  const isInnerPage = pathname !== `/${currentLang}` && pathname !== `/${currentLang}/`;

  // Debug log to identify this component
  console.log("NAVBAR COMPONENT:", "src/components/Layout.tsx");

  return (
    <div className={`min-h-screen ${isInnerPage ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Dark backdrop for inner pages to prevent white showing behind transparent header */}
      {isInnerPage && (
        <div className="fixed inset-x-0 top-0 h-32 bg-gradient-to-r from-blue-600 to-blue-700 -z-10" />
      )}
      
      {/* Red Development Strip */}
      <div className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-center text-sm py-1 h-8">
        Website under development
      </div>

      {/* Fixed Header */}
      <header
        className={[
          "fixed inset-x-0 z-40 border-b transition-all duration-200",
          useOverlayNavbar
            ? "top-8 bg-black/20 text-white border-white/10 backdrop-blur-sm shadow-lg"
            : "top-8 bg-white/95 text-slate-900 border-slate-200 shadow-sm backdrop-blur",
        ].join(" ")}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main navbar row */}
          <div className="flex h-16 items-center justify-between">
            {/* left side logo + nav */}
            <div className="flex items-center gap-6">
              <Link href={`/${currentLang}`} className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  EU
                </span>
                <span className="text-sm font-semibold tracking-tight">
                  ListAcrossEU
                </span>
              </Link>
              <nav className="hidden gap-3 text-sm md:flex">
                {navItems.map((item) => {
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "px-2 py-1 rounded-md transition-colors",
                        active
                          ? useOverlayNavbar
                            ? "bg-white/20 text-white"
                            : "bg-blue-50 text-blue-700"
                          : useOverlayNavbar
                            ? "text-white/90 hover:bg-white/10 hover:text-white"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* right side: CTA button + language dropdown + mobile menu */}
            <div className="flex items-center gap-3">
              {/* Debug marker to identify this navbar */}
              <span className="text-[10px] opacity-60 bg-red-500 text-white px-1">NAV-DEBUG-A</span>
              
              {/* List Your Business Free Button */}
              <button 
                onClick={listBusinessModal.openModal}
                className={[
                  "hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                  useOverlayNavbar
                    ? "bg-white text-blue-600 hover:bg-blue-50 shadow-md"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
                ].join(" ")}
              >
                List Your Business Free
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={[
                  "md:hidden p-2 rounded-md transition-colors",
                  useOverlayNavbar
                    ? "text-white hover:bg-white/10"
                    : "text-slate-600 hover:bg-slate-100",
                ].join(" ")}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex items-center gap-2">
                <label
                  htmlFor="lang-selector"
                  className="hidden text-xs font-medium md:inline-block opacity-90"
                >
                  Language
                </label>
                <select
                  id="lang-selector"
                  value={currentLang}
                  onChange={(e) => changeLang(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {SUPPORTED_LANGS.map((code) => (
                    <option key={code} value={code}>
                      {code.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-[88px] left-0 right-0 bg-white border-b border-slate-200 shadow-lg">
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                >
                  {item.label}
                </Link>
              ))}
              {/* Mobile CTA */}
              <button
                onClick={() => {
                  listBusinessModal.openModal();
                  setMobileMenuOpen(false);
                }}
                className="block mt-4 w-full px-3 py-2 bg-blue-600 text-white text-center rounded-md font-medium hover:bg-blue-700"
              >
                List Your Business Free
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={`${useOverlayNavbar ? "pt-[88px]" : "pt-[88px]"} transition-all duration-200 ${isInnerPage ? 'bg-slate-50' : ''}`}>
        {children}
      </main>

      {/* Footer */}
      <Footer />
      
      {/* Back to Top Button */}
      <BackToTop />
      
      {/* List Your Business Modal */}
      <ListYourBusinessModal
        isOpen={listBusinessModal.isOpen}
        onClose={listBusinessModal.closeModal}
        onSubmit={async (data) => {
          // Demo submission handler
          console.log('List Business Form Data:', data);
          
          // Try to submit to API, fallback to demo success
          try {
            const response = await fetch('/api/listings/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            
            if (!response.ok) throw new Error('API submission failed');
            
            alert('Business listing submitted successfully!');
          } catch (error) {
            // Fallback for demo
            alert('Business submitted (demo mode) - Thank you!');
          }
        }}
      />
    </div>
  );
}