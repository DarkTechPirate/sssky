import axios from "axios";
import toast from "react-hot-toast";

// 1. Configuration Constants
const API_URL = `${import.meta.env.VITE_API_URL}/api`;
export const GOOGLE_AUTH_URL = `${API_URL}/auth/google`;

// 2. Create Axios Instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 3. Response Interceptor (Global Error Handling)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // ==============================================================
    // 🛑 SILENT ROUTES: Don't show popups for these endpoints
    // ==============================================================
    const silentRoutes = ["/auth/me", "/gallery"];

    // Check if the current request URL matches any silent route
    if (
      error.config &&
      silentRoutes.some((route) => error.config.url.includes(route))
    ) {
      return Promise.reject(error);
    }
    // ==============================================================

    // A. Network / Connection Errors
    if (!error.response) {
      toast.error("Network Error - Is the Network available?");
      return Promise.reject(error);
    }

    // B. Extract message
    const { status, data } = error.response;
    const backendMessage = data?.message || "An unexpected error occurred.";

    // C. Handle specific status codes
    if (status === 401) {
      toast.error(backendMessage);

      setTimeout(() => {
        // Prevent redirect loop if already on login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 1000);
    } else if (status === 403) {
      toast.error(backendMessage);
    } else if (status === 404) {
      toast.error(backendMessage);
    } else if (status >= 500) {
      toast.error(backendMessage);
    } else {
      toast.error(backendMessage);
    }

    return Promise.reject(error);
  }
);

// 4. Login Function
export async function loginUser(email, password) {
  try {
    const response = await api.post("/auth/login", { email, password });
    toast.success(response.data.message || "Login Successful!");
    return {
      success: true,
      user: response.data.user,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed.",
    };
  }
}

// 5. SignUp Function
export async function SignUp(name, email, password, confirmPassword) {
  if (password !== confirmPassword) {
    toast.error("Passwords do not match!");
    return { success: false, message: "Passwords do not match" };
  }

  try {
    const response = await api.post("/auth/signup", {
      fullname: name,
      username: email.split("@")[0],
      email,
      password,
      confirmPassword,
    });
    toast.success(response.data.message || "Account created successfully!");
    return {
      success: true,
      user: response.data.user,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Signup failed.",
    };
  }
}

// 6. Check Auth Function (Silent)
export async function checkAuth() {
  try {
    const response = await api.get("/auth/me");
    return {
      isAuthenticated: true,
      user: response.data.user,
    };
  } catch (error) {
    // CASE 1: Server responded, but said "Unauthorized" (401)
    if (error.response && error.response.status === 401) {
      return {
        isAuthenticated: false,
        user: null,
      };
    }

    // CASE 2: Network Error or Server Down (No response or 500s)
    // We throw the error so the Provider knows to retry
    throw error;
  }
}

// 7. Logout Function
export async function logout() {
  try {
    await api.get("/auth/logout");
    toast.success("Logged out successfully");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 8. Reset Password Function
export async function ResetPassword(email) {
  try {
    await api.post("/auth/reset-password", {
      email,
    });
    toast.success("Email sent successfully!");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 9. Personal Info Update Function
export async function UpdatePersonalInfo(data) {
  try {
    const res = await api.put("/profile/info", data);

    toast.success(res.data?.message || "Profile updated successfully!");

    return {
      success: true,
      user: res.data?.user,
      message: res.data?.message,
    };
  } catch (error) {
    // Error toast handled by interceptor usually, but safe to return logic here
    return {
      success: false,
      message: error.response?.data?.message || "Update failed",
    };
  }
}

// 10. Upload Profile Picture Function (NEW)
export async function uploadProfileImage(file) {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await api.post("/profile/profile-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success(res.data?.message || "Upload started! Updating soon...");

    return {
      success: true,
      message: res.data?.message,
    };
  } catch (error) {
    console.error("Profile Upload Error:", error);
    // Error is typically shown by interceptor, but we return false to handle loading states
    return {
      success: false,
      message: error.response?.data?.message || "Upload failed",
    };
  }
}

// 11. Google One Tap Login Function
export async function googleOneTapLogin(token) {
  try {
    const response = await api.post("/auth/google/onetap", { token });

    toast.success(response.data.message || "Google Login Successful!");

    return {
      success: true,
      user: response.data.user,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Google Login Failed",
    };
  }
}

// ==============================================================
// 12. GALLERY FUNCTIONS (Admin)
// ==============================================================
export async function getallGallery() {
  try {
    const response = await api.get("/gallery");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch gallery",
    };
  }
}

// A. Fetch All Images
export async function getGallery() {
  try {
    const response = await api.get("/admin/gallery");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch gallery",
    };
  }
}

// B. Upload Images (Bulk)
export async function uploadGalleryImages(formData) {
  try {
    const response = await api.post("/admin/gallery", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Upload Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Upload failed",
    };
  }
}

// C. Delete Images (Bulk)
export async function deleteGalleryImages(ids) {
  try {
    const response = await api.post("/admin/gallery/delete-batch", { ids });
    toast.success(response.data.message || "Images deleted");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// D. Save Order
export async function reorderGalleryImages(items) {
  try {
    const response = await api.put("/admin/gallery/reorder", { items });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// E. Update Image Details (Title)
export async function updateGalleryImageDetails(id, title) {
  try {
    const response = await api.put(`/admin/gallery/${id}`, { title });
    toast.success("Image updated");
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false };
  }
}

// ==============================================================
// 13. PRODUCT FUNCTIONS (Public)
// ==============================================================

// A. Fetch All Products (With Filters)
export async function getAllProducts(filters = {}) {
  // filters expected: { category, search, minPrice, maxPrice, sort }
  try {
    const response = await api.get("/products", { params: filters });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load products",
    };
  }
}

// B. Fetch Single Product by ID
export async function getProductById(id) {
  try {
    const response = await api.get(`/products/${id}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Product not found",
    };
  }
}

// C. Get Recommendations
export async function getProductRecommendations(currentId, category) {
  try {
    const response = await api.get("/products/recommendations", {
      params: { currentId, category },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // Fail silently for recommendations (don't break the page)
    console.error("Recommendation Error:", error);
    return { success: false, data: [] };
  }
}
// ==============================================================
// PRODUCT MANAGEMENT (Admin)
// ==============================================================

export async function getAlladminProducts() {
  try {
    const response = await api.get("/admin/products");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error",
    };
  }
}

// ==============================================================
// ADMIN FUNCTIONS (Fixed Uploads)
// ==============================================================

// 1. Create Product
export async function createProduct(formData) {
  try {
    // Let Axios/Browser handle the boundary
    const response = await api.post("/admin/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Create Error:", error.response?.data);
    return {
      success: false,
      message: error.response?.data?.error || "Creation failed",
    };
  }
}

// 2. Update Product
export async function updateProduct(id, formData) {
  try {
    const response = await api.put(`/admin/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Update Error:", error.response?.data);
    return {
      success: false,
      message: error.response?.data?.error || "Update failed",
    };
  }
}

// 3. Delete Product
export async function deleteProduct(id) {
  try {
    await api.delete(`/admin/products/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Delete failed",
    };
  }
}

// ==============================================================
// 14. CART FUNCTIONS
// ==============================================================

// A. Get Cart
export async function getCart() {
  try {
    // Ensure your backend has router.get("/", ...) mounted at /api/cart
    const response = await api.get("/cart");
    return {
      success: true,
      cart: response.data.cart,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load cart",
    };
  }
}

// B. Add Item to Cart (Toasts handled here)
export async function addToCart(productId, color, size, quantity = 1) {
  try {
    const response = await api.post("/cart/add", {
      productId,
      color,
      size,
      quantity,
    });

    // ✅ API handles the success toast directly
    toast.success(response.data.message || "Added to cart successfully");

    return {
      success: true,
      cart: response.data.cart,
    };
  } catch (error) {
    // Error toasts are handled by your global axios interceptor
    return {
      success: false,
      message: error.response?.data?.message || "Failed to add item",
    };
  }
}

// C. Update Item Quantity
export async function updateCartItem(itemId, quantity) {
  try {
    const response = await api.put("/cart/update", { itemId, quantity });
    return {
      success: true,
      cart: response.data.cart,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update cart",
    };
  }
}

// D. Remove Item
export async function removeFromCart(itemId) {
  try {
    const response = await api.delete(`/cart/item/${itemId}`);
    toast.success("Item removed");
    return {
      success: true,
      cart: response.data.cart,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to remove item",
    };
  }
}

// E. Clear Cart
export async function clearCart() {
  try {
    await api.delete("/cart");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// ==============================================================
// 15. ADDRESS FUNCTIONS
// ==============================================================

// A. Get All Addresses
export async function getAddresses() {
  try {
    const response = await api.get("/address");
    return {
      success: true,
      addresses: response.data.addresses,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load addresses",
    };
  }
}

// B. Add Address
export async function addAddress(addressData) {
  try {
    const response = await api.post("/address", addressData);
    toast.success("Address added successfully");
    return {
      success: true,
      addresses: response.data.addresses,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to add address",
    };
  }
}

// C. Update Address
export async function updateAddress(id, addressData) {
  try {
    const response = await api.put(`/address/${id}`, addressData);
    toast.success("Address updated");
    return {
      success: true,
      addresses: response.data.addresses,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update address",
    };
  }
}

// D. Set Primary Address
export async function setPrimaryAddress(id) {
  try {
    const response = await api.put(`/address/${id}/primary`);
    toast.success("Primary address updated");
    return {
      success: true,
      addresses: response.data.addresses,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to set primary",
    };
  }
}

// E. Delete Address
export async function deleteAddress(id) {
  try {
    const response = await api.delete(`/address/${id}`);
    toast.success("Address deleted");
    return {
      success: true,
      addresses: response.data.addresses,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete address",
    };
  }
}

// ==============================================================
// 16. ORDER FUNCTIONS
// ==============================================================

// --- USER ORDER OPERATIONS ---

// A. Create Order
export async function createOrder(orderData) {
  try {
    // orderData should include: items, addressId, paymentMethod, totalAmount
    const response = await api.post("/orders", orderData);
    toast.success("Order placed successfully!");
    return {
      success: true,
      orderId: response.data.orderId,
      order: response.data.order,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to place order",
    };
  }
}

// B. Get My Orders
export async function getMyOrders() {
  try {
    const response = await api.get("/orders/my-orders");
    return {
      success: true,
      orders: response.data.orders,
      count: response.data.count,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch orders",
    };
  }
}

// C. Get Single Order Details
export async function getOrderById(id) {
  try {
    const response = await api.get(`/orders/${id}`);
    return {
      success: true,
      order: response.data.order,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Order not found",
    };
  }
}

// D. Cancel Order (User)
export async function cancelOrder(id, reason) {
  try {
    const response = await api.put(`/orders/${id}/cancel`, { reason });
    toast.success(response.data.message || "Order cancelled");
    return {
      success: true,
      status: response.data.status,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Cancellation failed",
    };
  }
}

// --- ADMIN ORDER OPERATIONS ---

// E. Admin Update Order Status
export async function adminUpdateOrderStatus(
  id,
  status,
  trackingNumber = null
) {
  try {
    const payload = { status };
    if (trackingNumber) payload.trackingNumber = trackingNumber;

    const response = await api.put(`/admin/order/${id}`, payload);
    toast.success("Order status updated");
    return {
      success: true,
      order: response.data.order,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Update failed",
    };
  }
}

// ==============================================================
// 17. USER MANAGEMENT FUNCTIONS (Admin)
// ==============================================================

/**
 * Fetch all users for the admin dashboard
 * Endpoint: GET /api/admin/users/all
 */
export async function getAllUsers() {
  try {
    const response = await api.get("/admin/users/all");
    return {
      success: true,
      data: response.data.data, // Accessing the data array from your controller's response
    };
  } catch (error) {
    // Interceptor handles the toast, but we return failure for the UI state
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch users",
    };
  }
}

/**
 * Update a user's role (e.g., from 'user' to 'admin')
 * Endpoint: PUT /api/admin/users/role/:id
 */
export async function updateUserRole(userId, roleData) {
  try {
    // roleData should be { role: 'admin' } or { role: 'user' }
    const response = await api.put(`/admin/users/role/${userId}`, roleData);

    // We don't necessarily need a toast here if the UI provides immediate feedback,
    // but it's good practice for admin actions.
    toast.success(response.data.message || "User role updated");

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update role",
    };
  }
}

/**
 * Delete a user account permanently
 * Endpoint: DELETE /api/admin/users/:id
 */
export async function deleteUser(userId) {
  try {
    const response = await api.delete(`/admin/users/${userId}`);

    // Toast is handled here to confirm deletion to the admin
    toast.success(response.data.message || "User deleted successfully");

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete user",
    };
  }
}

// Fetch full details for a single user (Admin)
export async function getUserDetailsForAdmin(userId) {
  try {
    const response = await api.get(`/admin/users/inspect/${userId}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to inspect user",
    };
  }
}

// Get all orders (Admin/Staff only)
export const getAllOrdersAdmin = async () => {
  try {
    const response = await api.get("/admin/orders/all"); // Ensure this route exists in backend
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch orders",
    };
  }
};

// Update Order Status (Admin/Staff)
export const updateOrderStatus = async (
  orderId,
  { status, trackingNumber }
) => {
  try {
    const response = await api.put(`/admin/orders/${orderId}`, {
      status,
      trackingNumber,
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update order",
    };
  }
};

// ==============================================================
// REVIEW FUNCTIONS
// ==============================================================

// A. Get Reviews for a Product
export async function getProductReviews(productId) {
  try {
    const response = await api.get(`/reviews/${productId}`); // Ensure route matches backend
    return {
      success: true,
      reviews: response.data.reviews,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load reviews",
    };
  }
}

// B. Add a Review
export async function addReview(productId, rating, comment) {
  try {
    const response = await api.post("/reviews", { productId, rating, comment });
    toast.success("Review posted successfully!");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to post review",
    };
  }
}

// ==============================================================
// BANNER ENDPOINTS (Corrected)
// ==============================================================

// --- BANNER ENDPOINTS ---

export const getBanners = async (page = "") => {
  try {
    const endpoint = page ? `/banners?page=${page}` : "/banners";
    const response = await api.get(endpoint);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

// 2. Create Banner (Upload)
export const createBanner = async (formData) => {
  try {
    // 🛑 CRITICAL FIX: Overriding the default JSON header
    // We set 'Content-Type': undefined so the browser generates the multipart boundary
    const response = await api.post("/admin/banners", formData, {
      headers: {
        "Content-Type": undefined,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Banner Upload Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create banner",
    };
  }
};

export const deleteBanner = async (id) => {
  try {
    const response = await api.delete(`/admin/banners/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

// NEW: Update Title/Subtitle
export const updateBannerDetails = async (id, data) => {
  try {
    const response = await api.put(`/admin/banners/${id}`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

// NEW: Reorder
export const reorderBanners = async (items) => {
  try {
    const response = await api.put("/admin/banners/reorder", { items });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

export default api;
