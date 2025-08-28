import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { MobileHeader } from '@/components/mobile-header';

export default function Layout() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <MobileHeader />
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}