import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Package, LayoutDashboard, LogOut, Search, User, Menu, X,
  CreditCard, History, Box, BarChart3
} from "lucide-react";

export const Layout: React.FC = () => {
  const { role, logout, email } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const AdminLinks = () => (
    <>
      <NavItem to="/admin" icon={<BarChart3 />} label="Dashboard" />
      <NavItem to="/admin/inventory" icon={<Box />} label="All Inventory" />
    </>
  );

  const InventoryLinks = () => (
    <>
      <NavItem to="/inventory" icon={<LayoutDashboard />} label="Stock Dashboard" />
      <NavItem to="/inventory/manage" icon={<Package />} label="Manage Catalog" />
    </>
  );

  const CustomerLinks = () => (
    <>
      <NavItem to="/customer" icon={<LayoutDashboard />} label="Store" />
      <NavItem to="/customer/products" icon={<Search />} label="Browse Catalog" />
      <NavItem to="/customer/orders" icon={<History />} label="My Orders" />
      <NavItem to="/customer/payments" icon={<CreditCard />} label="Payments" />
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-2 text-indigo-600">
          <Package className="w-6 h-6" />
          <span className="font-bold text-lg text-slate-900">OMS</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-500">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed md:sticky top-0 z-20 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="hidden md:flex items-center gap-2 p-6 border-b border-slate-100">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Package className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">SystemOMS</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-2 mt-4">Main Menu</div>
          {role === "ADMIN" && <AdminLinks />}
          {role === "INVENTORY" && <InventoryLinks />}
          {role === "CUSTOMER" && <CustomerLinks />}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {email?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{email}</p>
              <p className="text-xs text-slate-500 capitalize">{role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-10 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

// NavItem Helper
const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(`${to}/`));
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive 
          ? "bg-indigo-50 text-indigo-700" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
        {icon}
      </span>
      {label}
    </Link>
  );
};
