"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type CartItem = {
  product: string;
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: string) => void;
  removeFromCart: (product: string) => void;
  updateQuantity: (product: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem("africaMarketCart");

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          if (
            parsedCart.every(
              (item) =>
                typeof item === "object" &&
                typeof item.product === "string" &&
                typeof item.quantity === "number"
            )
          ) {
            setCartItems(parsedCart);
          } else if (
            parsedCart.every((item) => typeof item === "string")
          ) {
            setCartItems(
              parsedCart.map((product: string) => ({
                product,
                quantity: 1,
              }))
            );
          }
        }
      }
    } catch (error) {
      console.error("Could not load cart:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      window.localStorage.setItem(
        "africaMarketCart",
        JSON.stringify(cartItems)
      );
    } catch (error) {
      console.error("Could not save cart:", error);
    }
  }, [cartItems, loaded]);

  const addToCart = (product: string) => {
    setCartItems((current) => {
      const existing = current.find((item) => item.product === product);

      if (existing) {
        return current.map((item) =>
          item.product === product
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (product: string) => {
    setCartItems((current) =>
      current.filter((item) => item.product !== product)
    );
  };

  const updateQuantity = (product: string, quantity: number) => {
    setCartItems((current) =>
      current.map((item) =>
        item.product === product
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
