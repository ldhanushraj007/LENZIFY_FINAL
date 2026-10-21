import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/data/products';

interface CartItem extends Product {
    quantity: number;
}

export interface AppliedCouponState {
    code: string;
    discount: number;
    coupon_id?: number | null;
    description?: string;
    message?: string;
}

interface CartStore {
    items: CartItem[];
    appliedCoupon: AppliedCouponState | null;
    isLoginPromptOpen: boolean;
    openLoginPrompt: () => void;
    closeLoginPrompt: () => void;
    addItem: (product: Product & { quantity?: number; [key: string]: any }, user?: any) => Promise<boolean> | boolean;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, delta: number) => void;
    clearCart: () => void;
    setItems: (items: CartItem[]) => void;
    setAppliedCoupon: (coupon: AppliedCouponState | null) => void;
    removeAppliedCoupon: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            appliedCoupon: null,
            isLoginPromptOpen: false,
            openLoginPrompt: () => set({ isLoginPromptOpen: true }),
            closeLoginPrompt: () => set({ isLoginPromptOpen: false }),
            addItem: (product, user) => {
                if (user === null) {
                    set({ isLoginPromptOpen: true });
                    return false;
                }

                const qtyToAdd = Number((product as any).quantity) > 0 ? Number((product as any).quantity) : 1;
                const existingItem = get().items.find(item => item.id === product.id);
                if (existingItem) {
                    set({
                        items: get().items.map(item =>
                            item.id === product.id ? { ...item, quantity: (item.quantity || 1) + qtyToAdd } : item
                        )
                    });
                } else {
                    set({ items: [...get().items, { ...product, quantity: qtyToAdd }] });
                }
                return true;
            },
            removeItem: (productId) => set((state) => ({
                items: state.items.filter(item => item.id !== productId)
            })),
            updateQuantity: (productId, delta) => set((state) => ({
                items: state.items.map(item =>
                    item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
                )
            })),
            clearCart: () => {
                try {
                    sessionStorage.removeItem("lenzify_applied_coupon");
                    sessionStorage.removeItem("lenzify_pending_coupon");
                } catch {}
                set({ items: [], appliedCoupon: null });
            },
            setItems: (items) => set({ items }),
            setAppliedCoupon: (coupon) => {
                if (coupon) {
                    try {
                        sessionStorage.setItem("lenzify_applied_coupon", JSON.stringify(coupon));
                        sessionStorage.setItem("lenzify_pending_coupon", coupon.code);
                    } catch {}
                } else {
                    try {
                        sessionStorage.removeItem("lenzify_applied_coupon");
                        sessionStorage.removeItem("lenzify_pending_coupon");
                    } catch {}
                }
                set({ appliedCoupon: coupon });
            },
            removeAppliedCoupon: () => {
                try {
                    sessionStorage.removeItem("lenzify_applied_coupon");
                    sessionStorage.removeItem("lenzify_pending_coupon");
                } catch {}
                set({ appliedCoupon: null });
            },
            getTotalItems: () => get().items.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
            getTotalPrice: () => get().items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 0)), 0),
        }),
        { 
            name: 'lenzify-cart',
            partialize: (state) => ({ items: state.items, appliedCoupon: state.appliedCoupon })
        }
    )
);
