import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '' },
  { to: '/orders',    label: 'Orders',    icon: '' },
  { to: '/inventory', label: 'Inventory', icon: '' },
  { to: '/alerts',    label: 'Alerts',    icon: '' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-200">
        <h1 className="text-base font-bold text-blue-700">Eyewear OMS</h1>
        <p className="text-xs text-gray-400 mt-0.5">Order Management</p>
      </div>
      <nav className="flex-1 py-3">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-3 border-t border-gray-200">
        <NavLink
          to="/orders/new"
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          + New Order
        </NavLink>
      </div>
    </aside>
  );
}
