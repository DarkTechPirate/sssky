import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { checkAuth, getCart, getMyOrders } from "../services/api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // --- USER DATA ---
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("app_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem("app_cart");
    return stored ? JSON.parse(stored) : null;
  });
  const [orders, setOrders] = useState(() => {
    const stored = localStorage.getItem("app_orders");
    return stored ? JSON.parse(stored) : [];
  });
  const [isValidating, setIsValidating] = useState(true);

  // --- MODAL STATE ---
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    description: "",
    children: null,
  });

  // [DEBUG] Log whenever modal state changes
  useEffect(() => {
    console.log("CTX: modalState updated:", modalState);
  }, [modalState]);

  // ✅ Open Modal Function
  const openModal = useCallback(({ title, description, children }) => {
    console.log("CTX: openModal function triggered"); // DEBUG
    setModalState({
      isOpen: true,
      title,
      description,
      children,
    });
  }, []);

  // ✅ Close Modal Function
  const closeModal = useCallback(() => {
    console.log("CTX: closeModal function triggered"); // DEBUG
    setModalState((prev) => {
      if (!prev.isOpen) return prev;
      return { ...prev, isOpen: false };
    });
  }, []);

  // --- DATA SYNCING ---
  const refreshCart = useCallback(async () => {
    try {
      const res = await getCart();
      if (res.success) setCart(res.cart);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const res = await getMyOrders();
      if (res.success) setOrders(res.orders);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Persistence Effects
  useEffect(() => {
    if (user) localStorage.setItem("app_user", JSON.stringify(user));
    else localStorage.removeItem("app_user");
  }, [user]);
  useEffect(() => {
    if (cart) localStorage.setItem("app_cart", JSON.stringify(cart));
    else localStorage.removeItem("app_cart");
  }, [cart]);
  useEffect(() => {
    if (orders && orders.length > 0)
      localStorage.setItem("app_orders", JSON.stringify(orders));
    else localStorage.removeItem("app_orders");
  }, [orders]);

  // Auth Check
  useEffect(() => {
    let isMounted = true;
    const verifyUser = async () => {
      let isChecked = false;
      while (!isChecked && isMounted) {
        try {
          const result = await checkAuth();
          if (result.isAuthenticated) {
            setUser(result.user);
            const [cartRes, ordersRes] = await Promise.allSettled([
              getCart(),
              getMyOrders(),
            ]);
            if (cartRes.status === "fulfilled" && cartRes.value.success)
              setCart(cartRes.value.cart);
            if (ordersRes.status === "fulfilled" && ordersRes.value.success)
              setOrders(ordersRes.value.orders);
          } else {
            setUser(null);
            setCart(null);
            setOrders([]);
          }
          isChecked = true;
        } catch (error) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
      if (isMounted) setIsValidating(false);
    };
    verifyUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      cart,
      setCart,
      orders,
      setOrders,
      isValidating,
      refreshCart,
      refreshOrders,
      modalState,
      openModal,
      closeModal,
    }),
    [
      user,
      cart,
      orders,
      isValidating,
      modalState,
      openModal,
      closeModal, // Ensure these are dependencies
      refreshCart,
      refreshOrders,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
