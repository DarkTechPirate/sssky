import "./App.css";
import { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// CONTEXT
import { ThemeContext } from "./context/ThemeContext";
import { useApp } from "./context/Appcontext";

// COMPONENTS
import ScrollToTop from "./components/ScrollToTop";
import ProductDisplay from "./components/ProductDisplay";
import AuthLayout from "./components/layout/AuthLayout";
import Modal from "./components/layout/Modal";

// PAGES
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { MainLayout } from "./components/layout/MainLayout";
import ForgetPassword from "./pages/ForgetPassword";
import Checkout from "./pages/Checkout";

function App() {
  const { user, modalState, closeModal } = useApp();
  const { theme } = useContext(ThemeContext);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.bg;
    document.body.style.backgroundColor = theme.bg;
    document.documentElement.style.color = theme.text;
  }, [theme]);

  // --- AUTOMATICALLY CLOSE MODAL ON ROUTE CHANGE ---
  // ✅ FIX: Removed modalState.isOpen from dependency array.
  // This ensures it only runs when location.pathname changes, not when the modal opens.
  useEffect(() => {
    closeModal();
  }, [location.pathname, closeModal]);

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: "#333", color: "#fff" },
          success: { duration: 3000 },
        }}
      />

      <ScrollToTop />

      {/* --- GLOBAL MODAL MOUNT --- */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        description={modalState.description}
        theme={theme}
      >
        {modalState.children}
      </Modal>

      <Routes>
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/" replace /> : <Signup />}
          />
          <Route
            path="/forgot-password"
            element={user ? <Navigate to="/" replace /> : <ForgetPassword />}
          />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:id" element={<ProductDisplay />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/profile"
            element={user ? <Profile /> : <Navigate to="/" replace />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
