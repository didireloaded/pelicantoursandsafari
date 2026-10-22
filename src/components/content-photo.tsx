import { useQuery } from "@tanstack/react-query";
import { mediaUrl } from "@/lib/site-content-api";
export function ContentPhoto({
  path,
  alt,
  className = "h-64 w-full rounded-lg object-cover",
}: {
  path: string;
  alt: string;
  className?: string;
}) {
  const query = useQuery({
    queryKey: ["site-media", path],
    queryFn: () => mediaUrl(path),
    staleTime: 240000,
    refetchInterval: 300000,
    retry: 1,
  });
  return query.data ? (
    <img src={query.data} alt={alt} className={className} loading="lazy" decoding="async" />
  ) : (
    <div
      className={`flex items-center justify-center border border-border p-5 ${className}`}
      role="status"
    >
      {query.isError ? "Photo unavailable. Please reload." : "Loading photo…"}
    </div>
  );
}
