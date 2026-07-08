import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanySection } from "./CompanySection";
import { SystemSection } from "./SystemSection";
import { InventorySection } from "./InventorySection";
import { AppearanceSection } from "./AppearanceSection";
import { BackupSection } from "./BackupSection";
import ProfilePage from "@/pages/profile";
import { Building2, SlidersHorizontal, Package, UserCircle, Palette, DatabaseBackup } from "lucide-react";

export function Settings() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 py-5 border-b bg-card shrink-0">
        <h1 className="text-2xl font-serif text-foreground font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your company profile, system preferences, and application configuration.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="company" className="max-w-4xl">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
            <TabsTrigger value="company" className="gap-1.5" data-testid="tab-company">
              <Building2 className="w-3.5 h-3.5" /> Company
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-1.5" data-testid="tab-system">
              <SlidersHorizontal className="w-3.5 h-3.5" /> System
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-1.5" data-testid="tab-inventory">
              <Package className="w-3.5 h-3.5" /> Inventory
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5" data-testid="tab-profile">
              <UserCircle className="w-3.5 h-3.5" /> My Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5" data-testid="tab-appearance">
              <Palette className="w-3.5 h-3.5" /> Appearance
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-1.5" data-testid="tab-backup">
              <DatabaseBackup className="w-3.5 h-3.5" /> Backup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="mt-6">
            <CompanySection />
          </TabsContent>
          <TabsContent value="system" className="mt-6">
            <SystemSection />
          </TabsContent>
          <TabsContent value="inventory" className="mt-6">
            <InventorySection />
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <ProfilePage />
          </TabsContent>
          <TabsContent value="appearance" className="mt-6">
            <AppearanceSection />
          </TabsContent>
          <TabsContent value="backup" className="mt-6">
            <BackupSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
