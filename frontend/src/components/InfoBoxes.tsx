import Link from "next/link";

export type InfoBoxItem = {
  title: string;
  description: string;
  href: string;
  icon?: string;
};

type InfoBoxesProps = {
  title: string;
  subtitle?: string;
  items: InfoBoxItem[];
};

export default function InfoBoxes({ title, subtitle, items }: InfoBoxesProps) {
  return (
    <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.title}`}
            href={item.href}
            className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-purple-300 hover:bg-white hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              {item.icon && (
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-100 text-purple-700 text-xs font-semibold">
                  {item.icon}
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-purple-800">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
