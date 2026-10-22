import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { mediaUrl } from "@/lib/site-content-api";
import { initials } from "@/lib/admin-workspace";
export function StaffAvatar({ path, name }: { path?: string | null; name: string }) {
  const photo = useQuery({
    queryKey: ["site-media", path],
    enabled: !!path,
    queryFn: () => mediaUrl(path!),
    staleTime: 240000,
    refetchInterval: path ? 300000 : false,
    retry: 1,
  });
  return (
    <Avatar className="h-full w-full">
      <AvatarImage src={photo.data} alt={name} className="object-cover" />
      <AvatarFallback className="bg-transparent">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
