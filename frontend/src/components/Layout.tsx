"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { normalizeLang } from "@/lib/lang";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { useTranslations } from "@/i18n/translations";
import { debugLog, debugWarn } from "@/lib/debug";
import { resolveBlogDetailTargetUrl } from "@/lib/blogRouting";
import LanguageSelector from "@/components/LanguageSelector";

type LayoutProps = {
  children: ReactNode;
  headerExtra?: ReactNode;
  headerVariant?: "overlay" | "solid";
  withTopHeader?: boolean;
};

export default function Layout({
  children,
  headerExtra,
  headerVariant: _headerVariant = "solid",
  withTopHeader = false,
}: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }

    onScroll(); // initialize
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // pathname example: "/en/search" or "/nl/blog/xyz"
  const segments = pathname.split("/").filter(Boolean); // ["en", "search"]
  const currentLang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(currentLang);
  const toggleMenuLabel = t.actions.toggleMenu;

  async function changeLang(newLang: string) {
    const newSegments = [...segments];
    if (!newSegments.length) {
      newSegments.push(newLang);
    } else {
      newSegments[0] = newLang;
    }

    const isBlogDetail = newSegments.length >= 3 && newSegments[1] === "blog";
    if (isBlogDetail) {
      const currentSlug = String(params?.slug || newSegments[2] || "");
      let currentId: number | null = null;
      try {
        const storedId =
          window.sessionStorage.getItem("blogPostId") ||
          window.sessionStorage.getItem(`blogPostId:${currentLang}:${currentSlug}`);
        currentId = storedId ? Number(storedId) : null;
      } catch (storageError) {
        debugWarn("Unable to read blog post id for language switch.", storageError);
      }

      const targetUrl = await resolveBlogDetailTargetUrl({
        currentLang: currentLang,
        currentSlug,
        targetLang: newLang,
        storedId: currentId,
      });
      router.push(targetUrl);
      return;
    }

    const newPath = "/" + newSegments.join("/");
    router.push(newPath);
  }

  const browseCountries = [
    { name: t.nav.browseCountries.portugal, slug: "pt", flag: "/images/flags/pt.png" },
    { name: t.nav.browseCountries.spain, slug: "es", flag: "/images/flags/es.png" },
    { name: t.nav.browseCountries.france, slug: "fr", flag: "/images/flags/fr.png" },
    { name: t.nav.browseCountries.germany, slug: "de", flag: "/images/flags/de.png" },
    { name: t.nav.browseCountries.italy, slug: "it", flag: "/images/flags/it.png" },
    { name: t.nav.browseCountries.netherlands, slug: "nl", flag: "/images/flags/nl.png" },
  ];

  const browseCities = [
    { name: t.nav.browseCities.lisbon, slug: "lisbon" },
    { name: t.nav.browseCities.madrid, slug: "madrid" },
    { name: t.nav.browseCities.paris, slug: "paris" },
    { name: t.nav.browseCities.berlin, slug: "berlin" },
    { name: t.nav.browseCities.rome, slug: "rome" },
    { name: t.nav.browseCities.amsterdam, slug: "amsterdam" },
  ];

  const browseCategories = [
    { name: t.nav.browseCategories.restaurants, slug: "restaurants" },
    { name: t.nav.browseCategories.health, slug: "health" },
    { name: t.nav.browseCategories.professional, slug: "professional-services" },
    { name: t.nav.browseCategories.retail, slug: "retail" },
    { name: t.nav.browseCategories.homeServices, slug: "home-services" },
    { name: t.nav.browseCategories.beauty, slug: "beauty" },
  ];

  // Determine navbar appearance based on headerVariant and scroll
  const useOverlayNavbar = !scrolled;
  
  // Check if this is an inner page (not homepage)
  const isInnerPage = pathname !== `/${currentLang}` && pathname !== `/${currentLang}/`;

  // Debug log to identify this component
  debugLog("NAVBAR COMPONENT:", "src/components/Layout.tsx");

  return (
    <div className={`min-h-screen ${isInnerPage ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Dark backdrop for inner pages to prevent white showing behind transparent header */}
      {isInnerPage && (
        <div className="fixed inset-x-0 top-0 h-32 bg-gradient-to-r from-blue-600 to-blue-700 -z-10" />
      )}
      
      {/* Fixed Header */}
      <header
        className={[
          "fixed inset-x-0 z-40 border-b transition-all duration-200",
          useOverlayNavbar
            ? "bg-transparent text-white border-transparent"
            : "bg-white/95 text-slate-900 border-slate-200 shadow-md backdrop-blur",
          withTopHeader ? "top-8" : "top-0",
        ].join(" ")}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main navbar row */}
          <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center">
            {/* left: logo */}
            <div className="flex items-center justify-start">
              <Link href={`/${currentLang}`} className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {t.nav.brandShort}
                </span>
                <span className="text-sm font-semibold tracking-tight">
                  {t.nav.brandName}
                </span>
              </Link>
            </div>

            {/* center: nav */}
            <div className="hidden items-center justify-center gap-6 md:flex">
              <nav className="flex items-center gap-3 text-sm">
                <Link
                  href={`/${currentLang}`}
                  className={[
                    "px-2 py-1 rounded-md transition-colors",
                    pathname === `/${currentLang}`
                      ? useOverlayNavbar
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-blue-700"
                      : useOverlayNavbar
                        ? "text-white/90 hover:bg-white/10 hover:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                >
                  {t.nav.home}
                </Link>

                <div className="relative group">
                  <button
                    className={[
                      "px-2 py-1 rounded-md transition-colors inline-flex items-center gap-1",
                      useOverlayNavbar
                        ? "text-white/90 hover:bg-white/10 hover:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")}
                    type="button"
                  >
                    {t.nav.browse}
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.25 7.5L10 12.25 14.75 7.5H5.25z" />
                    </svg>
                  </button>
                  <div className="absolute left-1/2 top-full mt-3 w-[720px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="grid gap-6 p-6 lg:grid-cols-3">
                      <div>
                        <Link
                          href={`/${currentLang}/countries`}
                          className="text-sm font-semibold text-slate-900 mb-3 inline-flex hover:text-blue-700"
                        >
                          {t.nav.countries}
                        </Link>
                        <div className="grid grid-cols-2 gap-3">
                          {browseCountries.map((country) => (
                            <Link
                              key={country.slug}
                              href={`/${currentLang}/countries/${country.slug}`}
                              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              <img
                                src={country.flag}
                                alt={country.name}
                                className="h-4 w-4 rounded-full object-cover"
                              />
                              <span>{country.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Link
                          href={`/${currentLang}/cities`}
                          className="text-sm font-semibold text-slate-900 mb-3 inline-flex hover:text-blue-700"
                        >
                          {t.nav.cities}
                        </Link>
                        <div className="space-y-2">
                          {browseCities.map((city) => (
                            <Link
                              key={city.slug}
                              href={`/${currentLang}/cities/${city.slug}`}
                              className="block rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              {city.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Link
                          href={`/${currentLang}/categories`}
                          className="text-sm font-semibold text-slate-900 mb-3 inline-flex hover:text-blue-700"
                        >
                          {t.nav.categories}
                        </Link>
                        <div className="grid grid-cols-1 gap-2">
                          {browseCategories.map((category) => (
                            <Link
                              key={category.slug}
                              href={`/${currentLang}/categories/${category.slug}`}
                              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                              <span>{category.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/${currentLang}/pricing`}
                  className={[
                    "px-2 py-1 rounded-md transition-colors",
                    pathname === `/${currentLang}/pricing`
                      ? useOverlayNavbar
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-blue-700"
                      : useOverlayNavbar
                        ? "text-white/90 hover:bg-white/10 hover:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                >
                  {t.nav.pricing}
                </Link>

                <Link
                  href={`/${currentLang}/list-your-business`}
                  className={[
                    "px-2 py-1 rounded-md transition-colors",
                    useOverlayNavbar
                      ? "text-white/90 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                >
                  {t.nav.listYourBusiness}
                </Link>

                <Link
                  href={`/${currentLang}/blog`}
                  className={[
                    "px-2 py-1 rounded-md transition-colors",
                    pathname === `/${currentLang}/blog`
                      ? useOverlayNavbar
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-blue-700"
                      : useOverlayNavbar
                        ? "text-white/90 hover:bg-white/10 hover:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                >
                  {t.nav.blog}
                </Link>
              </nav>

            </div>

            {/* right: mobile controls */}
            <div className="flex items-center justify-end gap-3 md:justify-end">
              <div className="hidden md:block">
                <LanguageSelector
                  buttonClassName={
                    useOverlayNavbar
                      ? "text-white/90 hover:bg-white/10"
                      : "text-slate-700 hover:bg-slate-100"
                  }
                />
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={[
                  "md:hidden p-2 rounded-md transition-colors",
                  useOverlayNavbar
                    ? "text-white hover:bg-white/10"
                    : "text-slate-600 hover:bg-slate-100",
                ].join(" ")}
                aria-label={toggleMenuLabel}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="md:hidden">
                <LanguageSelector
                  buttonClassName={
                    useOverlayNavbar
                      ? "text-white/90 hover:bg-white/10"
                      : "text-slate-700 hover:bg-slate-100"
                  }
                />
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
          <div
            className={`absolute ${
              withTopHeader ? "top-[120px]" : "top-[88px]"
            } left-0 right-0 bg-white border-b border-slate-200 shadow-lg`}
          >
            <div className="px-4 py-2 space-y-1">
              <Link
                href={`/${currentLang}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              >
                {t.nav.home}
              </Link>
              <Link
                href={`/${currentLang}/countries`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              >
                {t.nav.browse}
              </Link>
              <Link
                href={`/${currentLang}/pricing`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              >
                {t.nav.pricing}
              </Link>
              <Link
                href={`/${currentLang}/list-your-business`}
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-left"
              >
                {t.nav.listYourBusiness}
              </Link>
              <Link
                href={`/${currentLang}/blog`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              >
                {t.nav.blog}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        className={`${
          withTopHeader ? "pt-[96px]" : "pt-[64px]"
        } transition-all duration-200 ${isInnerPage ? "bg-slate-50" : ""}`}
      >
        {children}
      </main>

      {/* Footer */}
      <Footer />
      
      {/* Back to Top Button */}
      <BackToTop />
      
    </div>
  );
}

