'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  LayoutDashboard,
  Mail,
  Menu,
  Package,
  Receipt,
  Users,
  Warehouse,
} from 'lucide-react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils/cn';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/orders', label: 'Orders', icon: Receipt },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/messages', label: 'Messages', icon: Inbox },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
] as const;

function useActiveHref() {
  const pathname = usePathname();

  return (href: string) => {
    // The dashboard is only active on an exact match, or every item would light up.
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(`${href}/`);
  };
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useActiveHref();

  return (
    <ul className="flex flex-col gap-0.5">
      {ADMIN_NAV.map((item) => {
        const active = isActive(item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                active
                  ? 'bg-espresso-900 text-cream-50'
                  : 'text-muted-foreground hover:bg-cream-200 hover:text-foreground',
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop sidebar navigation. */
export function AdminSidebarNav() {
  return (
    <nav aria-label="Admin sections">
      <NavList />
    </nav>
  );
}

/** Mobile navigation, in a slide-over. */
export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open admin menu"
          className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-cream-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
        >
          <Menu className="size-[18px]" aria-hidden="true" />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="max-w-xs">
        <SheetHeader>
          <SheetTitle className="text-base tracking-[0.16em]">Admin</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <nav aria-label="Admin sections">
            <NavList onNavigate={() => setOpen(false)} />
          </nav>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
