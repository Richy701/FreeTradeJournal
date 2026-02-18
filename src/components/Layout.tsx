import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { DemoBanner } from '@/components/demo-banner';
import { useAuth } from '@/contexts/auth-context';

export default function Layout() {
  const { isDemo } = useAuth();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="h-svh overflow-auto">
        <DemoBanner />
        <MobileHeader />
        <motion.main
          key={location.pathname}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? {} : { duration: 0.2, ease: 'easeOut' }}
          className={`flex-1 w-full ${isDemo ? 'pt-12' : ''}`}
        >
          <Outlet />
        </motion.main>
      </SidebarInset>
    </SidebarProvider>
  );
}