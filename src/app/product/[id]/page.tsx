import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProductDetailsClient from "./ProductDetailsClient";
import type { Metadata } from "next";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, description, price, offer_price, brand, primary_image, product_images(image_url)")
    .eq("id", id)
    .single();

  if (!product) {
    return { title: "Product Not Found" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lenzify.in';
  const imageUrl = (product as any).primary_image || (product as any).product_images?.[0]?.image_url || `${siteUrl}/placeholder.jpg`;
  const price = product.offer_price || product.price;

  return {
    title: `${product.name}${product.brand ? ` by ${product.brand}` : ''} — ₹${price}`,
    description: product.description?.slice(0, 160) || `Shop ${product.name} at LENZIFY. Premium eyewear with free shipping.`,
    openGraph: {
      title: `${product.name} — LENZIFY`,
      description: product.description?.slice(0, 160) || `Shop ${product.name} at LENZIFY.`,
      images: [{ url: imageUrl, width: 800, height: 600, alt: product.name }],
      url: `${siteUrl}/product/${id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — LENZIFY`,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${siteUrl}/product/${id}`,
    },
    other: {
      'product:price:amount': String(price),
      'product:price:currency': 'INR',
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch Product with Images and Category info
  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      product_images(*),
      categories (*)
    `)
    .eq("id", id)
    .single();

  if (!product) {
    notFound();
  }

  // 2. Fetch Similar Products — same brand first, then same product_type
  let similarProducts: any[] = [];
  
  // Try same brand first
  if (product.brand) {
    const { data: brandMatches } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .neq("id", id)
      .eq("brand", product.brand)
      .eq("is_enabled", true)
      .limit(4);
    similarProducts = brandMatches || [];
  }
  
  // If not enough, fill up with same product_type
  if (similarProducts.length < 4 && product.product_type) {
    const existingIds = [id, ...similarProducts.map((p: any) => p.id)];
    const { data: typeMatches } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .not("id", "in", `(${existingIds.join(",")})`)
      .eq("product_type", product.product_type)
      .eq("is_enabled", true)
      .limit(4 - similarProducts.length);
    similarProducts = [...similarProducts, ...(typeMatches || [])];
  }


  // 3. Fetch Reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, users(name)")
    .eq("product_id", id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  // 4. Get User Session
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {
    user = null;
  }

  // 5. Check Wishlist status
  let isInWishlist = false;
  if (user) {
    const { data: wish } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .maybeSingle();
    isInWishlist = !!wish;
  }

  // 6. Fetch compatible lenses (if product_type is frame)
  // and also fetch global options (coatings, materials, etc.)
  let productLenses: any[] = [];
  
  // Fetch ALL active lenses and categorize them
  const { data: allLenses } = await supabase
    .from("lenses")
    .select("*")
    .eq("is_active", true);
  
  if (product.product_type === "frame") {
    // For frames, we specifically want to know which 'primary' lenses are compatible
    const { data: pl } = await supabase
      .from("product_lenses")
      .select("lens_id")
      .eq("product_id", id);
    
    const compatibleLensIds = (pl || []).map(p => p.lens_id);
    
    // We separate lenses into those specifically compatible and global add-ons
    // FALLBACK: If a frame has NO specific mappings, assume ALL primary lenses are compatible
    productLenses = (allLenses || []).filter(lens => 
      lens.category !== "type" || 
      compatibleLensIds.length === 0 || 
      compatibleLensIds.includes(lens.id)
    );
  } else {
    productLenses = allLenses || [];
  }

  return (
    <ProductDetailsClient 
      product={product}
      user={user}
      similarProducts={similarProducts || []}
      initialReviews={reviews || []}
      isInWishlist={isInWishlist}
      availableLenses={productLenses}
    />
  );
}
