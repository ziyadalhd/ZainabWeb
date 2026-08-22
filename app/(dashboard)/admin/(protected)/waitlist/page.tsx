import { redirect } from "next/navigation";

export default function WaitlistPage() {
  redirect("/admin/registrations?view=waitlist");
}
