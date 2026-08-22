import { redirect } from "next/navigation";

export default function CurrentRegistrationsPage() {
  redirect("/admin/registrations?view=upcoming");
}
