import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/data/products';
import { createClient } from '@/lib/supabase/client';

interface CartItem extends Product {
    quantity: number;
}

interface CartStore {
    items: CartItem[];
    isLoginPromptOpen: boolean;
    openLoginPrompt: () => void;
    closeLoginPrompt: () => void;
    addItem: (product: Product & { quantity?: number; [key: string]: any }, user?: any) => Promise<boolean> | boolean;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, delta: number) => void;
    clearCart: () => void;
    setItems: (items: CartItem[]) => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isLoginPromptOpen: false,
            openLoginPrompt: () => set({ isLoginPromptOpen: true }),
            closeLoginPrompt: () => set({ isLoginPromptOpen: false }),
            addItem: (product, user) => {
                // If user object is passed explicitly and is null/undefined
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
            clearCart: () => set({ items: [] }),
            setItems: (items) => set({ items }),
            getTotalItems: () => get().items.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
            getTotalPrice: () => get().items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 0)), 0),
        }),
        { 
            name: 'lenzify-cart',
            partialize: (state) => ({ items: state.items })
        }
    )
);
