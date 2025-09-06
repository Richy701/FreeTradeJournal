import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { DemoBanner } from '@/components/demo-banner';
import { useAuth } from '@/contexts/auth-context';

export default function Layout() {
  const { isDemo } = useAuth();
  
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <DemoBanner />
        <MobileHeader />
        <main className={`flex-1 w-full ${isDemo ? 'pt-12' : ''}`}>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}