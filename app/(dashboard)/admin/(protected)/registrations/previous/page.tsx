import { redirect } from "next/navigation";

export default function PreviousRegistrationsPage() {
  redirect("/admin/registrations?view=previous");
}
