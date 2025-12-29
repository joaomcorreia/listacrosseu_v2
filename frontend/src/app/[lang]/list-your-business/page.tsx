export default async function ListYourBusinessPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        List your business
      </h1>

      <p className="text-slate-600">
        This page is loading correctly. Content will be added next.
      </p>
    </div>
  );
}