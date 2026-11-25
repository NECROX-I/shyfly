import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import {
  FiGrid,
  FiBox,
  FiShoppingBag,
  FiLayers,
  FiTag,
  FiUsers,
  FiLogOut,
  FiMenu,
  FiX,
  FiExternalLink,
  FiSettings,
  FiEdit3,
  FiShield,
  FiCornerUpLeft,
} from "react-icons/fi";
import { useAuth } from "../../store";
import { useLockBody } from "../../lib/hooks";
import ThemeToggle from "../ThemeToggle";

const LINKS = [
  ["dashboard", "Dashboard", FiGrid],
  ["orders", "Orders", FiShoppingBag],
  ["returns", "Returns", FiCornerUpLeft],
  ["products", "Products", FiBox],
  ["categories", "Categories", FiLayers],
  ["coupons", "Coupons", FiTag],
  ["people", "Customers & messages", FiUsers],
  ["content", "Website content", FiEdit3],
  ["settings", "Store settings", FiSettings],
  ["team", "Team & security", FiShield],
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  useLockBody(open); // phone drawer: don't scroll the page behind it
  useEffect(() => setOpen(false), [pathname]);
  const cls = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition ${isActive ? "bg-plum-700 text-white shadow-soft" : "text-plum-800 hover:bg-plum-50"}`;
  return (
    <div className="min-h-dvh bg-[#faf6f8] lg:flex">
      {/* sidebar: off-canvas drawer on phones/tablets, fixed column on desktop. Scrolls on its own if the screen is short. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[82%] max-w-[18rem] transform flex-col overflow-y-auto overscroll-contain border-r border-plum-100 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] transition duration-300 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <img
              src="/logo-mark.png"
              alt="Shyfly"
              className="mb-1 h-12 w-auto"
            />
            <p className="mb-6 text-[11px] uppercase tracking-[.25em] text-plum-700/50">
              Admin panel
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="-mr-2 -mt-1 grid h-11 w-11 place-items-center rounded-full text-plum-800 hover:bg-plum-50 lg:hidden"
            aria-label="Close menu"
          >
            <FiX size={22} />
          </button>
        </div>
        <nav className="space-y-1">
          {LINKS.map(([to, l, I]) => (
            <NavLink key={to} to={to} className={cls}>
              <I size={18} />
              {l}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2 pt-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              target="_blank"
              className="flex min-h-[44px] items-center gap-2 px-4 text-sm text-plum-700 hover:text-rose-500"
            >
              <FiExternalLink /> View store
            </Link>
            <ThemeToggle
              className="grid h-11 w-11 place-items-center rounded-full text-plum-700 transition hover:bg-plum-50"
              size={18}
            />
          </div>
          <button
            onClick={() => {
              logout();
              nav("/admin/login");
            }}
            className="flex min-h-[48px] w-full items-center gap-2 rounded-xl bg-blush px-4 py-3 text-sm text-plum-800"
          >
            <FiLogOut /> Log out ({user?.name?.split(" ")[0]})
          </button>
        </div>
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-plum-950/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex items-center gap-1 border-b border-plum-100 bg-white px-2 py-1.5 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Menu"
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-plum-50"
          >
            <FiMenu size={24} />
          </button>
          <b className="font-display text-2xl text-plum-800">Shyfly admin</b>
          <ThemeToggle
            className="ml-auto grid h-11 w-11 place-items-center rounded-full text-plum-700 hover:bg-plum-50"
            size={20}
          />
        </div>
        <main className="p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
