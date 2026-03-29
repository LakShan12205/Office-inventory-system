import { getWorkstations } from "@/lib/api";

export default async function WorkstationsPage() {
  const result = await getWorkstations("");

  const workstations = Array.isArray(result)
    ? result
    : Array.isArray((result as any)?.items)
      ? (result as any).items
      : Array.isArray((result as any)?.data)
        ? (result as any).data
        : [];

  return <div>Workstations page works. Count: {workstations.length}</div>;
}