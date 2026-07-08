import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  return (
    <PlaceholderPage 
      title="Analytics & Reports"
      description="Exportable data on mortality rates, yield metrics, and overall nursery performance."
      icon={BarChart3}
    />
  );
}
