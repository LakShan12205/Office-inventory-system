import { redirect } from "next/navigation";
import { AccessRequestsAdmin } from "@/components/auth/access-requests-admin";
import { PageHeader } from "@/components/ui/page-header";
import { getAccessRequests, getCurrentUser } from "@/lib/api";

export default async function AdminAccessRequestsPage() {
  const { user } = await getCurrentUser();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { requests } = await getAccessRequests();

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
