export function appendQueryParam(
  query: URLSearchParams,
  key: string,
  value: string | string[] | undefined
) {
  if (typeof value !== "string") {
    return;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }

  query.set(key, trimmed);
}
