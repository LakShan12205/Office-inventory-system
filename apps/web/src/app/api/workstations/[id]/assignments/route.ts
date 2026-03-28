import { createWorkstationAssignment } from "../../../_lib/mock-data";
import { handleRoute } from "../../../_lib/route-utils";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    const body = (await request.json()) as {
      assetId: string;
      assignmentType?: "PRIMARY" | "TEMPORARY_REPLACEMENT" | "SPARE";
      assignedDate?: string;
      notes?: string | null;
    };

    return createWorkstationAssignment(id, {
      assetId: body.assetId,
      assignmentType: body.assignmentType ?? "PRIMARY",
      assignedDate: body.assignedDate,
      notes: body.notes ?? null
    });
  });
}
