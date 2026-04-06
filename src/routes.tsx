import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { CustomerDashboard } from "./pages/customer/CustomerDashboard";
import { CustomerProducts } from "./pages/customer/CustomerProducts";
import { CustomerOrders } from "./pages/customer/CustomerOrders";
import { OrderTracking } from "./pages/customer/OrderTracking";
import { CustomerPayments } from "./pages/customer/CustomerPayments";
import { CustomerProfile } from "./pages/customer/CustomerProfile";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminInventoryView } from "./pages/admin/AdminInventoryView";
import { AdminCustomerDetails } from "./pages/admin/AdminCustomerDetails";
import { InventoryDashboard } from "./pages/inventory/InventoryDashboard";
import { InventoryManage } from "./pages/inventory/InventoryManage";

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <p className="text-8xl mb-4">🚫</p>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Denied</h1>
      <p className="text-slate-500">You don't have permission to view this page.</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/unauthorized", element: <Unauthorized /> },

  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          // Customer Routes
          {
            path: "customer",
            element: <ProtectedRoute allowedRoles={["CUSTOMER"]} />,
            children: [
              { index: true, element: <CustomerDashboard /> },
              { path: "products", element: <CustomerProducts /> },
              { path: "orders", element: <CustomerOrders /> },
              { path: "orders/:id", element: <OrderTracking /> },
              { path: "payments", element: <CustomerPayments /> },
              { path: "profile", element: <CustomerProfile /> },
            ],
          },
          // Admin Routes
          {
            path: "admin",
            element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: "inventory", element: <AdminInventoryView /> },
              { path: "customers/:userId", element: <AdminCustomerDetails /> },
            ],
          },
          // Inventory Routes (also accessible to ADMIN)
          {
            path: "inventory",
            element: <ProtectedRoute allowedRoles={["INVENTORY", "ADMIN"]} />,
            children: [
              { index: true, element: <InventoryDashboard /> },
              { path: "manage", element: <InventoryManage /> },
            ],
          },
        ]
      }
    ]
  },
  { path: "*", element: <Navigate to="/" replace /> }
]);
