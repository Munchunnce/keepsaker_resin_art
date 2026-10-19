import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // 🔥 O(1) Hash Map (Array nahi!)
    items: {}, 
    totalQuantity: 0,
    totalPrice: 0,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const product = action.payload;
            
            // UNIQUE KEY GENERATOR: Agar ek hi product 2 alag colors mein add ho, toh wo alag-alag item banenge
            const cartItemId = `${product._id}_${product.selectedColor || 'default'}`;

            // O(1) Check: Kya yeh item pehle se cart mein hai?
            if (state.items[cartItemId]) {
                // Hai toh bas quantity badha do (No array looping!)
                state.items[cartItemId].qty += 1;
            } else {
                // Nahi hai toh naya entry bana do
                state.items[cartItemId] = { 
                    ...product, 
                    cartItemId, // Reference ke liye ID save rakho
                    qty: 1 
                };
            }

            // Totals update karo
            state.totalQuantity += 1;
            state.totalPrice += product.basePrice;
        },

        removeFromCart: (state, action) => {
            const cartItemId = action.payload;
            const item = state.items[cartItemId];

            if (item) {
                // Totals me se ghatao
                state.totalQuantity -= item.qty;
                state.totalPrice -= (item.basePrice * item.qty);
                // O(1) Delete operation
                delete state.items[cartItemId];
            }
        },

        updateQuantity: (state, action) => {
            const { cartItemId, type } = action.payload;
            const item = state.items[cartItemId];

            if (item) {
                if (type === 'increase') {
                    item.qty += 1;
                    state.totalQuantity += 1;
                    state.totalPrice += item.basePrice;
                } else if (type === 'decrease' && item.qty > 1) {
                    item.qty -= 1;
                    state.totalQuantity -= 1;
                    state.totalPrice -= item.basePrice;
                }
            }
        },

        clearCart: (state) => {
            state.items = {};
            state.totalQuantity = 0;
            state.totalPrice = 0;
        }
    }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;