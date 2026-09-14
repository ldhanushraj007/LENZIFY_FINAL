import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/data/products';

interface CartItem extends Product {
    quantity: number;
}

interface CartStore {
    items: CartItem[];
    addItem: (product: Product) => void;
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
            addItem: (product) => set((state) => {
                const qtyToAdd = Number(product.quantity) > 0 ? Number(product.quantity) : 1;
                const existingItem = state.items.find(item => item.id === product.id);
                if (existingItem) {
                    return {
                        items: state.items.map(item =>
                            item.id === product.id ? { ...item, quantity: (item.quantity || 1) + qtyToAdd } : item
                        )
                    };
                }
                return { items: [...state.items, { ...product, quantity: qtyToAdd }] };
            }),
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
        { name: 'lenzify-cart' }
    )
);
