import HomeClient from "@/components/home/HomeClient";

const CATEGORY_CARDS = [
  { name: "Men", image_url: "/images/categories/men.png", href: "/products?gender=Men" },
  { name: "Women", image_url: "/images/categories/women.png", href: "/products?gender=Women" },
  { name: "Kids", image_url: "/images/categories/kids.png", href: "/products?gender=Kids" },
  { name: "Eyeglasses", image_url: "/images/categories/eyeglasses.png", href: "/products?type=Eyeglasses" },
  { name: "Sunglasses", image_url: "/images/categories/sunglasses.png", href: "/products?type=Sunglasses" },
  { name: "Computer Glasses", image_url: "/images/categories/computer_glasses.png", href: "/products?type=Computer Glasses" },
  { name: "Reading Glasses", image_url: "/images/categories/reading_glasses.png", href: "/products?type=Reading Glasses" },
  { name: "Contact Lenses", image_url: "/images/categories/contact_lenses.png", href: "/contact-lenses" },
  { name: "Accessories", image_url: "/images/categories/accessories.png", href: "/products?type=Accessories" },
];

const DEFAULT_SECTIONS = [
  { id: "default-hero", section_key: "hero", content: { subtitle: "The Visionary Editorial", title: "Visionary Excellence. Timeless Style.", description: "Curated eyewear for those who view the world through a lens of sophistication and clarity.", button_text: "Explore Collection", button_link: "/products", image_url: "/images/editorial/hero_woman_reading.png" } },
  { id: "default-categories", section_key: "categories", content: { title: "Categories", subtitle: "Defining the future of optical aesthetics.", items: CATEGORY_CARDS } },
  { id: "default-featured", section_key: "featured_products", content: { title: "Featured Products", subtitle: "Handpicked selections." } },
  { id: "default-trending", section_key: "trending_products", content: { title: "Trending", subtitle: "What everyone is wearing right now." } },
  { id: "default-new", section_key: "new_arrivals", content: { title: "New Arrivals", subtitle: "Fresh out of the design lab." } },
  { id: "default-bestsellers", section_key: "best_sellers", content: { title: "Best Sellers", subtitle: "Our most loved frames." } },
  { id: "default-brands", section_key: "brand_section", content: { title: "Premium Brands", subtitle: "Top tier craftsmanship." } },
];

import { unstable_cache } from "next/cache";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const getCachedHomeData = unstable_cache(
  async () => {
    // Create an anonymous, cookie-free client so unstable_cache can statically cache it
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    
    // Run queries in parallel
    const [configRes, featuredRes, trendingRes, newArrivalsRes, categoriesRes, brandsRes, collectionsRes, testimonialsRes, customerCountRes, productCountRes] = await Promise.all([
      supabase.from("homepage_config").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
      supabase.from("products").select("*, product_images(image_url, is_primary)").eq("is_enabled", true).eq("is_featured", true).order('created_at', { ascending: false }).limit(4),
      supabase.from("products").select("*, product_images(image_url, is_primary)").eq("is_enabled", true).eq("is_trending", true).order('created_at', { ascending: false }).limit(4),
      supabase.from("products").select("*, product_images(image_url, is_primary)").eq("is_enabled", true).eq("is_new_arrival", true).order('created_at', { ascending: false }).limit(4),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("brands").select("*").eq("is_featured", true).limit(10),
      supabase.from("collections").select("*").limit(10),
      supabase.from("reviews").select("rating, review, users(name), products(name)").eq("status", "approved").order("created_at", { ascending: false }).limit(6),
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_enabled", true),
    ]);

    const defaultCollections = [
      { id: 'col1', name: 'Under ₹699', type: 'BUDGET PICKS', banner_url: '/images/collections/budget_picks.jpg', href: '/products?max_price=699' },
      { id: 'col2', name: 'Under ₹999', type: 'EVERYDAY ESSENTIALS', banner_url: '/images/collections/everyday_essentials.jpg', href: '/products?max_price=999' },
      { id: 'col3', name: 'Under ₹1499', type: 'MOST POPULAR', banner_url: '/images/collections/most_popular.jpg', href: '/products?max_price=1499' },
      { id: 'col4', name: 'Under ₹1999', type: 'PREMIUM VALUE', banner_url: '/images/collections/premium_value.jpg', href: '/products?max_price=1999' },
    ];

    return {
      config: configRes.data,
      featuredProducts: featuredRes.data || [],
      trendingProducts: trendingRes.data || [],
      newArrivals: newArrivalsRes.data || [],
      categories: categoriesRes.data || [],
      brands: brandsRes.data || [],
      collections: (collectionsRes.data && collectionsRes.data.length > 0) ? collectionsRes.data : defaultCollections,
      testimonials: testimonialsRes.data || [],
      stats: {
        customerCount: customerCountRes.count || 0,
        productCount: productCountRes.count || 0,
      },
    };
  },
  ['home-data'],
  { revalidate: 60, tags: ['home-data'] }
);

export default async function Home() {
  const { config, featuredProducts, trendingProducts, newArrivals, categories, brands, collections, testimonials, stats } = await getCachedHomeData();

  // Only show display-worthy categories — exclude internal collection/display tags
  const dynamicCategories = categories
    .filter((c: any) => c.type === 'gender' || c.type === 'product')
    .map((c: any) => {
      const href = c.type === 'gender'
        ? `/products?gender=${c.name}`
        : `/products?type=${c.name}`;

      const staticInfo = CATEGORY_CARDS.find(item => item.name === c.name);
      // DB column is `image`, not `image_url`
      const image = c.image || staticInfo?.image_url || `/images/categories/${c.slug}.png`;

      return { name: c.name, image_url: image, href, type: c.type };
    });

  let initialSections = config && config.length > 0 ? config : [
  { id: "default-hero", section_key: "hero", content: { subtitle: "The Visionary Editorial", title: "Visionary Excellence. Timeless Style.", description: "Curated eyewear for those who view the world through a lens of sophistication and clarity.", button_text: "Explore Collection", button_link: "/products", image_url: "/images/editorial/hero_home_right.png" } },
    { id: "default-categories", section_key: "categories", content: { title: "Categories", subtitle: "Defining the future of optical aesthetics.", items: dynamicCategories.length > 0 ? dynamicCategories : CATEGORY_CARDS } },
    { id: "default-featured", section_key: "featured_products", content: { title: "Featured Products", subtitle: "Handpicked selections." } },
    { id: "default-trending", section_key: "trending_products", content: { title: "Trending", subtitle: "What everyone is wearing right now." } },
    { id: "default-new", section_key: "new_arrivals", content: { title: "New Arrivals", subtitle: "Fresh out of the design lab." } },
    { id: "default-collections", section_key: "collections_gallery", content: { title: "Editor's Collections", subtitle: "Curated aesthetic paths.", items: collections } },
    { id: "default-bestsellers", section_key: "best_sellers", content: { title: "Best Sellers", subtitle: "Our most loved frames." } },
    { id: "default-brands", section_key: "brand_section", content: { title: "Premium Brands", subtitle: "Top tier craftsmanship.", items: brands } },
  ];

  // Always replace categories/collections/brands items with fresh DB data.
  // Prevents stale or missing CMS-saved items from hiding live sections.
  initialSections = initialSections.map(sec => {
    if (sec.section_key === 'categories') {
      const items = dynamicCategories.length > 0 ? dynamicCategories : CATEGORY_CARDS;
      return { ...sec, content: { ...sec.content, items } };
    }
    if (sec.section_key === 'collections_gallery') {
      return { ...sec, content: { ...sec.content, items: collections } };
    }
    if (sec.section_key === 'brand_section') {
      return { ...sec, content: { ...sec.content, items: brands } };
    }
    return sec;
  });
  if (!initialSections.some(sec => sec.section_key === 'collections_gallery')) {
    initialSections.push({ id: "default-collections", section_key: "collections_gallery", content: { title: "Editor's Collections", subtitle: "Curated aesthetic paths.", items: collections } });
  }
  if (!initialSections.some(sec => sec.section_key === 'brand_section')) {
    initialSections.push({ id: "default-brands", section_key: "brand_section", content: { title: "Premium Brands", subtitle: "Top tier craftsmanship.", items: brands } });
  }

  const initialProducts = {
    featured: featuredProducts,
    trending: trendingProducts,
    new_arrivals: newArrivals
  };

  return <HomeClient initialSections={initialSections} initialProducts={initialProducts} testimonials={testimonials} stats={stats} />;
}
