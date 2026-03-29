import { getAssets } from "@/lib/api";

export default async function AssetsPage() {
  const result = await getAssets("");

  const assets = Array.isArray(result)
    ? result
    : Array.isArray((result as any)?.items)
      ? (result as any).items
      : Array.isArray((result as any)?.data)
        ? (result as any).data
        : [];

  return <div>Assets page works. Count: {assets.length}</div>;
}