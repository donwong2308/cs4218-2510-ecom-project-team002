// context/cart.js
import React, {
  useState,
  useContext,
  createContext,
  useEffect,
  useRef,
} from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const skipFirstPersist = useRef(true);

  useEffect(() => {
    const raw = localStorage.getItem("cart");
    if (raw) {
      try {
        setCart(JSON.parse(raw));
      } catch (e) {
        console.error("Invalid cart in localStorage", e);
        localStorage.removeItem("cart");
      }
    }
  }, []);

  useEffect(() => {
    if (skipFirstPersist.current) {
      skipFirstPersist.current = false;
      return;
    }
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to persist cart", e);
    }
  }, [cart]);

  return (
    <CartContext.Provider value={[cart, setCart]}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
