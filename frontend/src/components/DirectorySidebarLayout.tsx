import { ReactNode } from 'react';

type DirectorySidebarLayoutProps = {
  children: ReactNode;
  sidebar: ReactNode;
};

/** Shared directory content shell: main inventory first, sidebar below it on mobile. */
export default function DirectorySidebarLayout({ children, sidebar }: DirectorySidebarLayoutProps) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)] lg:px-8">
      <main className="min-w-0">{children}</main>
      <aside className="min-w-0 lg:order-last">{sidebar}</aside>
    </div>
  );
}
