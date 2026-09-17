"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type CartContextType = {
  cartItems: string[];
  addToCart: (product: string) => void;
  removeFromCart: (product: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load the saved cart once when the website starts
  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(
        "africaMarketCart"
      );

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart);
        }
      }
    } catch (error) {
      console.error("Could not load cart:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save the cart only after the saved cart has been loaded
  useEffect(() => {
    if (!loaded) {
      return;
    }

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
    setCartItems((current) => [...current, product]);
  };

  const removeFromCart = (product: string) => {
    setCartItems((current) =>
      current.filter((item) => item !== product)
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}