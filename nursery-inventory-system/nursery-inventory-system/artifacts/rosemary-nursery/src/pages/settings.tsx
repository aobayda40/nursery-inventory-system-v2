import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <PlaceholderPage 
      title="System Settings"
      description="Manage user access, nursery locations, and system-wide configurations."
      icon={Settings}
    />
  );
}
