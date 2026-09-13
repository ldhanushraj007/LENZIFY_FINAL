# 🔍 Lenzify — 100% Production Testing Checklist

Follow this checklist step-by-step in your browser at `http://localhost:8000` to verify that all admin functions, storefront flows, mobile features, and database operations are working seamlessly.

---

## A. Admin Panel Verification

- [ ] **1. Admin Dashboard (`/admin/dashboard`)**
  - Open terminal and browser console (`F12`).
  - Refresh `/admin/dashboard`.
  - **Verify**: Total Sales, Total Orders, Total Customers, Low Stock, and Abandoned Carts load with real numbers.
  - **Verify**: No `TypeError: fetch failed` or `{}` in server logs or browser console.

- [ ] **2. Prescription Lenses List (`/admin/lenses`)**
  - Verify page header reads **"Prescription Lenses (for Frames)"**.
  - Verify sidebar navigation says **"Prescription Lenses"**.
  - All lenses (Single Vision, Bifocal, Blue Cut, Photochromic, etc.) should be listed with active badges.

- [ ] **3. Edit Lens & Schema Test (`/admin/lenses/[id]/edit`)**
  - Click **Edit** on *Blue Cut* or *Photochromic*.
  - Change the price (e.g., set to ₹1,299) and update features.
  - In the **Power Range Pricing** table, click **"Load Standard Presets"** or add a custom row (`-4.25` to `-8.00`, Extra: `500`).
  - Click **Save Changes**.
  - **Verify**: Saves immediately with green toast notification. **Zero schema cache errors** (no `sub_category` error).

- [ ] **4. Soft Delete Lens Test**
  - On the lens edit page, click the red **Deactivate Lens** button and confirm.
  - **Verify**: Lens status updates to Inactive without deleting related order history or breaking existing carts.

- [ ] **5. Add Contact Lens Test (`/admin/products/new`)**
  - Open the **Product Type** dropdown.
  - **Verify**: The option displays **"Contact Lenses"** (not the generic "Lens").

- [ ] **6. Customers Management (`/admin/customers`)**
  - Visit `/admin/customers`.
  - **Verify**: Customers table loads profiles from Supabase without RLS errors.

---

## B. Storefront & Customer Journey Verification

- [ ] **7. Mobile Add to Cart (Guest Mode)**
  - Open Chrome DevTools (`F12`) → Toggle **Device Toolbar** (`Ctrl+Shift+M`) to simulate a mobile viewport (e.g., iPhone 14 / Pixel 7).
  - Open an Incognito window (unauthenticated).
  - Browse frames on the homepage or catalog.
  - **Verify**: Quick Add and Wishlist buttons are directly tappable on mobile without requiring mouse hover.
  - Click a product → click **"Add to Cart"** (Frame only).
  - **Verify**: You are **NOT** redirected to `/auth/login`. Cart badge count increments.

- [ ] **8. Prescription Lens Customization & Dynamic Surcharge**
  - On a frame product page, click **"Select Lenses"**.
  - Select your configured lens (e.g., *Blue Cut*).
  - On the prescription step, enter high power values:
    - **Right Eye (OD) SPH**: `-5.00`
    - **Left Eye (OS) SPH**: `-2.00`
  - **Verify**: Surcharge badge appears (e.g., `+₹500 (High Power Power Adjustment)`).
  - Proceed to the review step.
  - **Verify**: Price breakdown explicitly itemizes:
    - Frame price
    - Base lens price
    - Power adjustment surcharge
    - Total calculated price
  - Click **"Add to Cart"**.

- [ ] **9. Cart & Checkout Review (`/cart`)**
  - Go to `/cart`.
  - **Verify**:
    - Both items (the frame-only product and the prescription-configured product) are intact.
    - Product images load correctly (no gray placeholder squares).
    - Subtotal reflects the exact base + lens + surcharge price.
  - Refresh the page while still logged out.
  - **Verify**: Cart items are **not** wiped.

- [ ] **10. Login & Cart Sync**
  - Click **"Proceed to Checkout"** or log in with an existing customer account.
  - **Verify**: Guest cart items seamlessly sync to the logged-in user session in Supabase.

---

## C. Database One-Time Check

- [ ] **11. Supabase SQL Migration Execution**
  - Run the following query in your **Supabase Dashboard → SQL Editor**:
    ```sql
    ALTER TABLE lenses ADD COLUMN IF NOT EXISTS power_ranges jsonb DEFAULT '[]'::jsonb;
    NOTIFY pgrst, 'reload schema';
    ```
  - **Verify**: Power tiers persist permanently in PostgreSQL across reloads.
