export interface HouseBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  is_featured: boolean;
  sort_order: number;
}

export const HOUSE_BRANDS: HouseBrand[] = [
  {
    id: "b1000000-0000-0000-0000-000000000001",
    name: "Brat Emoji",
    slug: "brat-emoji",
    logo_url: "/brands/brat-emoji.png",
    is_featured: true,
    sort_order: 1,
  },
  {
    id: "b1000000-0000-0000-0000-000000000002",
    name: "Glenn Parker",
    slug: "glenn-parker",
    logo_url: "/brands/glenn-parker.png",
    is_featured: true,
    sort_order: 2,
  },
  {
    id: "b1000000-0000-0000-0000-000000000003",
    name: "Nikos Eleni",
    slug: "nikos-eleni",
    logo_url: "/brands/nikos-eleni.png",
    is_featured: true,
    sort_order: 3,
  },
  {
    id: "b1000000-0000-0000-0000-000000000004",
    name: "Diana",
    slug: "diana",
    logo_url: "/brands/diana.png",
    is_featured: true,
    sort_order: 4,
  },
  {
    id: "b1000000-0000-0000-0000-000000000005",
    name: "Jacky",
    slug: "jacky",
    logo_url: "/brands/jacky.png",
    is_featured: true,
    sort_order: 5,
  },
  {
    id: "b1000000-0000-0000-0000-000000000006",
    name: "Le Lily",
    slug: "le-lily",
    logo_url: "/brands/le-lily.png",
    is_featured: true,
    sort_order: 6,
  },
];

export function getBrandLogo(brandNameOrSlug?: string | null): string | null {
  if (!brandNameOrSlug) return null;
  const target = brandNameOrSlug.trim().toLowerCase();
  const match = HOUSE_BRANDS.find(
    (b) => b.name.toLowerCase() === target || b.slug.toLowerCase() === target
  );
  return match ? match.logo_url : null;
}
