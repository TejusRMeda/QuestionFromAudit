"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardSidebarProps {
  userEmail: string;
  userName?: string;
  userAvatar?: string;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/questionnaires",
    label: "Questionnaires",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/trusts",
    label: "Trusts",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/suggestions",
    label: "Suggestions",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
];

export default function DashboardSidebar({ userEmail, userName, userAvatar }: DashboardSidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const displayName = userName || userEmail.split("@")[0];
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Desktop sidebar — dual rail */}
      <aside className="hidden lg:flex flex-row h-full flex-shrink-0">
        {/* Left icon rail */}
        <TooltipProvider delayDuration={200}>
          <div className="w-14 bg-slate-900 flex flex-col items-center py-4 gap-1">
            {/* Brand mark */}
            <div className="w-8 h-8 rounded-lg bg-[#4A90A4] flex items-center justify-center mb-4 flex-shrink-0">
              <span className="text-white text-xs font-bold tracking-tight">QA</span>
            </div>

            {/* Nav icons */}
            <nav className="flex flex-col items-center gap-1 flex-1">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                          active
                            ? "bg-slate-700 text-white"
                            : "text-slate-500 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {item.icon}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>

            {/* Sign out icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>

            {/* Avatar */}
            <div className="mt-2">
              {userAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userAvatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                  referrerPolicy="no-referrer"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#4A90A4]/30 flex items-center justify-center text-xs font-semibold text-[#4A90A4]">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </TooltipProvider>

        {/* Right nav panel */}
        <div className="w-52 bg-white border-r border-slate-100 flex flex-col py-4">
          {/* Workspace label */}
          <p className="px-4 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Workspace
          </p>

          {/* Nav items */}
          <nav className="flex-1 px-2 space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className={active ? "text-blue-600" : "text-slate-500"}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2.5 px-1 mb-2">
              {userAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userAvatar}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full flex-shrink-0"
                  referrerPolicy="no-referrer"
                  width={28}
                  height={28}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#4A90A4]/20 flex items-center justify-center text-xs font-semibold text-[#4A90A4] flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 flex safe-area-pb">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                active ? "text-blue-600 font-semibold" : "text-slate-500"
              }`}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
