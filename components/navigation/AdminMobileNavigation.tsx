import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { adminNavigation } from "@/lib/navigation";

export function AdminMobileNavigation() {
  return <MobileNavigation items={adminNavigation} label="الأقسام" />;
}
