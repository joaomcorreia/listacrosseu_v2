'use client';

interface Business {
  name: string;
  address?: string;
  address_line1?: string;
  postal_code?: string;
  city?: { name: string } | null;
  country?: { name: string } | null;
}

interface ContactSectionProps {
  business: Business;
  tierStyles: { borderColor: string };
}

export function ContactSection({ business, tierStyles }: ContactSectionProps) {
  const address = [business.address_line1 || business.address, business.postal_code, business.city?.name, business.country?.name]
    .filter(Boolean)
    .join(', ');

  return (
    <section id="contact-section" className={`rounded-lg border ${tierStyles.borderColor} bg-white p-6`}>
      <h2 className="text-xl font-semibold text-gray-900">Contact information</h2>
      <p className="mt-2 text-sm text-gray-600">Direct contact tools are not available for this listing yet.</p>
      {address && <p className="mt-4 text-sm text-gray-700">{address}</p>}
    </section>
  );
}
