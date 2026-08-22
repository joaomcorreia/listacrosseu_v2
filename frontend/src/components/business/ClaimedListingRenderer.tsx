import PostcardCanvas from './PostcardCanvas';

export type ClaimedListingViewData = {
  name: string;
  description?: string;
  logo_url?: string;
  image_url?: string;
  background_image?: string;
  phone?: string;
  website?: string;
  contact_email?: string;
  whatsapp_number?: string;
  address?: string;
  address_line1?: string;
  postal_code?: string;
  region?: string;
  languages?: string[];
  accent_color?: string;
  overlay_color?: string;
  overlay_opacity?: number;
  visibility?: Record<string, boolean>;
  category?: { name: string } | null;
  business_type?: string;
  city?: { name: string } | null;
  country?: { name: string } | null;
};

export default function ClaimedListingRenderer({ listing, preview = false }: { listing: ClaimedListingViewData; preview?: boolean }) {
  return <PostcardCanvas listing={{ ...listing, visibility: listing.visibility || {} }} mode={preview ? 'preview' : 'public'} />;
}
