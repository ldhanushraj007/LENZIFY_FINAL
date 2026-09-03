"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export async function uploadToSupabase(file: File, bucket: string = "product-images") {
  const supabase = await createAdminClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  console.log(`Uploading ${file.name} (${file.size} bytes) to ${bucket}/${filePath}...`);
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: true
    });

  if (error) {
    console.error("Upload error details:", error);
    throw new Error(`STORAGE UPLOAD ERROR (${file.name}): ${error.message}. Please create bucket 'product-images' in Supabase Storage with public access enabled.`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function createProduct(formData: FormData) {
  const supabase = await createAdminClient();

  const product_type = formData.get("product_type") as string || "frame";
  
  // Extract common fields
  const name = formData.get("name") as string;
  const brand = formData.get("brand") as string;
  const sku = formData.get("sku") as string;
  const price = parseFloat(formData.get("price") as string);
  const discount_price = formData.get("offer_price") ? parseFloat(formData.get("offer_price") as string) : null;
  const stock = parseInt(formData.get("stock") as string);
  const categoryIdRaw = formData.get("category_id");
  const category_id = categoryIdRaw ? parseInt(categoryIdRaw as string) : null;
  const description = formData.get("description") as string;
  
  // Extract Specs
  const frame_type = formData.getAll("frame_style").join(", ");
  const shape = formData.get("shape") as string;
  const material = formData.getAll("material").join(", ");
  const gender = formData.getAll("gender"); 
  const color = formData.get("color") as string;
  const size = formData.get("size") as string;

  const collection = formData.getAll("collection");
  const usage_type = formData.getAll("usage_type");
  
  const colorsRaw = formData.get("colors") as string;
  const sizesRaw = formData.get("sizes") as string;
  let colorsList: any[] = [];
  let sizesList: any[] = [];
  try {
    colorsList = colorsRaw ? JSON.parse(colorsRaw) : [];
  } catch (e) {
    console.error("Error parsing colors:", e);
  }
  try {
    sizesList = sizesRaw ? JSON.parse(sizesRaw) : [];
  } catch (e) {
    console.error("Error parsing sizes:", e);
  }

  // Upload color-specific images
  for (let i = 0; i < colorsList.length; i++) {
    const colorFile = formData.get(`color_image_${i}`) as File;
    if (colorFile && colorFile.size > 0) {
      const url = await uploadToSupabase(colorFile);
      colorsList[i].image = url;
    }
  }

  const colors = colorsList.map(c => JSON.stringify(c));
  const sizes = sizesList.map(s => JSON.stringify(s));
  
  // Extract Metadata
  const is_featured = formData.get("is_featured") === "true";
  const is_trending = formData.get("is_trending") === "true";
  const is_new_arrival = formData.get("is_new_arrival") === "true";
  const is_editors_choice = formData.get("is_editors_choice") === "true";
  const is_enabled = formData.get("is_enabled") !== "false";

  // Handle Image Uploads
  let primary_image_url = "";
  const primaryFile = formData.get("primary_image_file");
  if (primaryFile && primaryFile instanceof File && primaryFile.size > 0 && primaryFile.name !== "undefined") {
    primary_image_url = await uploadToSupabase(primaryFile);
  }

  const additionalFiles = formData.getAll("additional_images_files") as File[];
  const additional_image_urls: string[] = [];
  for (const file of additionalFiles) {
    if (file && file.size > 0) {
      const url = await uploadToSupabase(file);
      additional_image_urls.push(url);
    }
  }

  if (!primary_image_url && additional_image_urls.length > 0) {
    primary_image_url = additional_image_urls[0];
  }
  if (!primary_image_url) {
    primary_image_url = "/placeholder.jpg";
  }

  const { data: product, error: productError } = await supabase.from("products").insert({
    name,
    sku,
    description,
    price,
    discount_price,
    category_id,
    brand,
    product_type,
    frame_type,
    shape,
    gender,
    material,
    color,
    size,
    collection,
    colors,
    sizes,
    stock,
    is_featured,
    is_trending,
    is_new_arrival,
    is_editors_choice,
    primary_image: primary_image_url,
    is_enabled,
    images_360: (() => {
      try {
        return JSON.parse(formData.get("images_360") as string || "[]");
      } catch (e) {
        console.error("Error parsing images_360:", e);
        return [];
      }
    })(),
    specifications: (() => {
      try {
        const specs = JSON.parse(formData.get("specifications") as string || "{}");
        return { ...specs, usage_type };
      } catch (e) {
        console.error("Error parsing specifications:", e);
        return { usage_type };
      }
    })(),
    tags: (formData.get("tags") as string || "").split(",").map(t => t.trim()).filter(Boolean),
    variants: (() => {
      try {
        return JSON.parse(formData.get("variants") as string || "[]");
      } catch (e) {
        console.error("Error parsing variants:", e);
        return [];
      }
    })()
  }).select("id").single();

  if (productError) {
    console.error("Error creating product:", productError);
    redirect(`/admin/products/new?error=${encodeURIComponent(productError.message)}`);
  }

  // Handle compatible lenses
  const compatibleLenses = formData.getAll("compatible_lenses") as string[];
  if (compatibleLenses.length > 0) {
    const productLensesToInsert = compatibleLenses.map(lensId => ({
      product_id: product.id,
      lens_id: lensId
    }));
    const { error: plError } = await supabase.from("product_lenses").insert(productLensesToInsert);
    if (plError) console.error("Error inserting product lenses:", plError);
  }

  // Insert Images record into product_images table
  const imagesToInsert = [];
  if (primary_image_url) {
    imagesToInsert.push({ product_id: product.id, image_url: primary_image_url, is_primary: true });
  }
  additional_image_urls.forEach(url => {
    imagesToInsert.push({ product_id: product.id, image_url: url, is_primary: false });
  });

  if (imagesToInsert.length > 0) {
    const { error: imageError } = await supabase.from("product_images").insert(imagesToInsert);
    if (imageError) console.error("Error inserting product images:", imageError);
  }

  // Handle Multi-Sector (Junction Table)
  const categoryIds = formData.getAll("category_ids") as string[];
  if (categoryIds.length > 0) {
    const sectorLinks = categoryIds.map(catId => ({
      product_id: product.id,
      category_id: parseInt(catId)
    }));
    const { error: sectorError } = await supabase.from("product_categories").insert(sectorLinks);
    if (sectorError) console.error("Error linking sectors:", sectorError);
  }

  revalidateTag('home-data', 'max');
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath(`/product/${product.id}`);
  if ((product as any)?.slug) revalidatePath(`/product/${(product as any).slug}`);
  redirect("/admin/products?success=true");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createAdminClient();

  try {
    const product_type = formData.get("product_type") as string || "frame";

    // Extract common fields
    const name = formData.get("name") as string;
    const brand = formData.get("brand") as string;
    const sku = formData.get("sku") as string;
    const price = parseFloat(formData.get("price") as string);
    const discount_price = formData.get("offer_price") ? parseFloat(formData.get("offer_price") as string) : null;
    const stock = parseInt(formData.get("stock") as string);
    const categoryIdRaw = formData.get("category_id");
    const category_id = categoryIdRaw ? parseInt(categoryIdRaw as string) : null;
    const description = formData.get("description") as string;
    
    // Extract Specs
    const frame_type = formData.getAll("frame_style").join(", ");
    const shape = formData.get("shape") as string;
    const material = formData.getAll("material").join(", ");
    const gender = formData.getAll("gender"); 
    const color = formData.get("color") as string;
    const size = formData.get("size") as string;

    const collection = formData.getAll("collection");
    const usage_type = formData.getAll("usage_type");
    
    const colorsRaw = formData.get("colors") as string;
    const sizesRaw = formData.get("sizes") as string;
    let colorsList: any[] = [];
    let sizesList: any[] = [];
    try {
      colorsList = colorsRaw ? JSON.parse(colorsRaw) : [];
    } catch (e) {
      console.error("Error parsing colors:", e);
    }
    try {
      sizesList = sizesRaw ? JSON.parse(sizesRaw) : [];
    } catch (e) {
      console.error("Error parsing sizes:", e);
    }

    // Upload color-specific images
    for (let i = 0; i < colorsList.length; i++) {
      const colorFile = formData.get(`color_image_${i}`) as File;
      if (colorFile && colorFile.size > 0) {
        const url = await uploadToSupabase(colorFile);
        colorsList[i].image = url;
      }
    }

    const colors = colorsList.map(c => JSON.stringify(c));
    const sizes = sizesList.map(s => JSON.stringify(s));
    
    // Extract Metadata
    const is_featured = formData.get("is_featured") === "true";
    const is_trending = formData.get("is_trending") === "true";
    const is_new_arrival = formData.get("is_new_arrival") === "true";
    const is_editors_choice = formData.get("is_editors_choice") === "true";
    const is_enabled = formData.get("is_enabled") !== "false";

    const updatePayload: any = {
      name,
      sku,
      description,
      price,
      discount_price,
      category_id,
      brand,
      product_type,
      frame_type,
      shape,
      gender,
      material,
      color,
      size,
      collection,
      colors,
      sizes,
      stock,
      is_featured,
      is_trending,
      is_new_arrival,
      is_editors_choice,
      is_enabled,
      images_360: (() => {
        try {
          return JSON.parse(formData.get("images_360") as string || "[]");
        } catch (e) {
          console.error("Error parsing images_360:", e);
          return [];
        }
      })(),
      specifications: (() => {
        try {
          const specs = JSON.parse(formData.get("specifications") as string || "{}");
          return { ...specs, usage_type };
        } catch (e) {
          console.error("Error parsing specifications:", e);
          return { usage_type };
        }
      })(),
      tags: (formData.get("tags") as string || "").split(",").map(t => t.trim()).filter(Boolean),
      variants: (() => {
        try {
          return JSON.parse(formData.get("variants") as string || "[]");
        } catch (e) {
          console.error("Error parsing variants:", e);
          return [];
        }
      })()
    };

    // Handle image updates
    const primaryFile = formData.get("primary_image_file") as File;
    const additionalFiles = formData.getAll("additional_images_files") as File[];
    
    if (primaryFile && primaryFile.size > 0) {
      const uploaded_url = await uploadToSupabase(primaryFile);
      const primary_image_url = `${uploaded_url}?v=${Date.now()}`;
      updatePayload.primary_image = primary_image_url;
      
      // Update product_images table as well
      await supabase.from("product_images").delete().eq("product_id", id).eq("is_primary", true);
      await supabase.from("product_images").insert({ product_id: id, image_url: primary_image_url, is_primary: true });
    }

    console.log("Updating product ID:", id);
    console.log("Update Payload:", JSON.stringify(updatePayload, null, 2));

    const { data: product, error: productError } = await supabase.from("products").update(updatePayload).eq("id", id).select().single();
    
    if (productError) {
      console.error("Supabase Update Error:", productError);
      throw productError;
    }

    // Handle compatible lenses update
    await supabase.from("product_lenses").delete().eq("product_id", id);
    const compatibleLenses = formData.getAll("compatible_lenses") as string[];
    if (compatibleLenses.length > 0) {
      const productLensesToInsert = compatibleLenses.map(lensId => ({
        product_id: id,
        lens_id: lensId
      }));
      await supabase.from("product_lenses").insert(productLensesToInsert);
    }

    // Handle additional images
    for (const file of additionalFiles) {
      if (file && file.size > 0) {
        const url = await uploadToSupabase(file);
        await supabase.from("product_images").insert({ product_id: id, image_url: url, is_primary: false });
      }
    }

    // Handle Multi-Sector Update
    const categoryIds = formData.getAll("category_ids") as string[];
    await supabase.from("product_categories").delete().eq("product_id", id);
    if (categoryIds.length > 0) {
      const sectorLinks = categoryIds.map(catId => ({
        product_id: id,
        category_id: parseInt(catId)
      }));
      await supabase.from("product_categories").insert(sectorLinks);
    }

    console.log("Successfully updated product row:", product.id);

    // Aggressive revalidation
    revalidateTag('home-data', 'max');
    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath(`/product/${id}`);
    if (product?.slug) revalidatePath(`/product/${product.slug}`);
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${id}/edit`);

  } catch (error: any) {
    console.error("CRITICAL UPDATE FAILURE:", error);
    return { success: false, error: error.message || "Unknown update error" };
  }

  const redirectUrl = "/admin/products?updated=true";
  console.log("Redirecting to:", redirectUrl);
  redirect(redirectUrl);
}

export async function deleteProduct(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  
  revalidateTag('home-data', 'max');
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}

export async function duplicateProduct(id: string) {
    const supabase = await createAdminClient();
    const { data: product, error: fetchError } = await supabase.from("products").select("*, product_images(*)").eq("id", id).single();
    if (fetchError || !product) return { error: fetchError?.message || "Product not found" };

    const { id: _, created_at: __, product_images, ...newProductData } = product;
    newProductData.name = `${product.name} (Copy)`;
    const { data: newProduct, error: insertError } = await supabase.from("products").insert(newProductData).select("id").single();
    if (insertError) return { error: insertError.message };

    if (product_images && product_images.length > 0) {
        const imagesToInsert = product_images.map((img: any) => ({
            product_id: newProduct.id,
            image_url: img.image_url,
            is_primary: img.is_primary
        }));
        await supabase.from("product_images").insert(imagesToInsert);
    }
    
    revalidateTag('home-data', 'max');
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("products").update({ is_enabled: !currentStatus }).eq("id", id);
  if (error) return { error: error.message };
  
  revalidateTag('home-data', 'max');
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}

/**
 * CATALOG SYNCHRONIZATION (CSV)
 */

export async function exportProducts() {
    const supabase = await createAdminClient();
    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    if (!products || products.length === 0) return { success: true, csv: "" };

    // Standard CSV Generation
    const headers = ["name", "brand", "sku", "price", "discount_price", "stock", "product_type", "frame_type", "shape", "material", "color", "size"];
    const csvContent = [
        headers.join(","),
        ...products.map(p => headers.map(h => `"${(p as any)[h] || ''}"`).join(","))
    ].join("\n");

    return { success: true, csv: csvContent };
}

export async function importProducts(csvContent: string) {
    const supabase = await createAdminClient();
    const lines = csvContent.split("\n").filter(line => line.trim());
    if (lines.length < 2) return { error: "Insufficient data protocol." };

    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((h, i) => {
            obj[h] = values[i];
        });
        return obj;
    });

    for (const item of data) {
        // Upsert logic based on SKU
        const { error } = await supabase.from("products").upsert({
            name: item.name,
            brand: item.brand,
            sku: item.sku,
            price: parseFloat(item.price) || 0,
            discount_price: parseFloat(item.discount_price) || null,
            stock: parseInt(item.stock) || 0,
            product_type: item.product_type || 'frame',
            frame_type: item.frame_type,
            shape: item.shape,
            material: item.material,
            color: item.color,
            size: item.size,
            is_enabled: true
        }, { onConflict: 'sku' });
        
        if (error) console.error(`Sync error for ${item.sku}:`, error);
    }

    revalidateTag('home-data', 'max');
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true };
}
