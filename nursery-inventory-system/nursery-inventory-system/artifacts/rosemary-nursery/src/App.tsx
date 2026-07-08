import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import LoginPage from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import PlantMaster from '@/pages/plant-master';
import Inventory from '@/pages/inventory';
import InventoryDetail from '@/pages/inventory-detail';
import PurchasedPlants from '@/pages/purchased-plants';
import Production from '@/pages/production';
import ProjectsPage from '@/pages/projects';
import ProjectHistoryPage from '@/pages/project-history';
import PlantIssuePage from '@/pages/plant-issue';
import PlantIssueDetailPage from '@/pages/plant-issue-detail';
import MaterialMasterPage from '@/pages/material-master';
import MaterialPurchasePage from '@/pages/material-purchase';
import Reports from '@/pages/reports';
import Settings from '@/pages/settings';
import ProfilePage from '@/pages/profile';
import UsersPage from '@/pages/users';
import AuditLogsPage from '@/pages/audit-logs';

const queryClient = new QueryClient();

function Router() {
  const { user, isLoading } = useAuth();

  // Wait for auth check before rendering routes
  if (isLoading) return null;

  return (
    <Switch>
      {/* Public route */}
      <Route path="/login">
        {user ? <Redirect to="/" /> : <LoginPage />}
      </Route>

      {/* All protected routes share the AppShell */}
      <Route>
        <ProtectedRoute>
          <SettingsProvider>
            <AppShell>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/plant-master" component={PlantMaster} />
                <Route path="/inventory" component={Inventory} />
                <Route path="/inventory/:id" component={InventoryDetail} />
                <Route path="/purchased-plants" component={PurchasedPlants} />
                <Route path="/production" component={Production} />
                <Route path="/projects" component={ProjectsPage} />
                <Route path="/projects/:id/history" component={ProjectHistoryPage} />
                <Route path="/plant-issue" component={PlantIssuePage} />
                <Route path="/plant-issue/:id" component={PlantIssueDetailPage} />
                <Route path="/material-master" component={MaterialMasterPage} />
                <Route path="/material-purchase" component={MaterialPurchasePage} />
                <Route path="/reports" component={Reports} />
                <Route path="/settings" component={Settings} />
                <Route path="/profile" component={ProfilePage} />
                <Route path="/users">
                  <ProtectedRoute roles={['Administrator', 'Manager']}>
                    <UsersPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/audit-logs">
                  <ProtectedRoute roles={['Administrator', 'Manager']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                </Route>
                <Route component={NotFound} />
              </Switch>
            </AppShell>
          </SettingsProvider>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
