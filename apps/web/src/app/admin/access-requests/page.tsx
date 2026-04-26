export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { AccessRequestsAdmin } from "@/components/auth/access-requests-admin";
import { PageHeader } from "@/components/ui/page-header";
import { getAccessRequests, getCurrentUser } from "@/lib/api";

export default async function AdminAccessRequestsPage() {
  let user;

  try {
    const res = await getCurrentUser();
    user = res.user;
  } catch (error) {
    // 🔥 If not authenticated → redirect to login
    redirect("/login");
  }

  // 🔥 Safety check
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let requests: any[] = [];

  try {
    const res = await getAccessRequests();
    requests = res.requests || [];
  } catch (error) {
    // 🔥 Prevent build/runtime crash if API fails
    requests = [];
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Access Requests"
        description="Review pending access requests and create approved user accounts with temporary credentials."
      />
      <AccessRequestsAdmin requests={requests} />
    </div>
  );
}