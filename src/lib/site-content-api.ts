import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  parseContent,
  readPublishedContent,
  type ContentKind,
  type ContentRow,
  type ContentData,
} from "./site-content";

export const PUBLISHED_CONTENT_STALE_TIME = 5 * 60_000;

export async function publishedContent(kind: ContentKind) {
  const { data, error } = await supabase
    .rpc("published_site_content", { _kind: kind })
    .abortSignal(AbortSignal.timeout(10000));
  if (error) throw new Error("Content could not be loaded. Please retry.");
  return readPublishedContent(data);
}
export function usePublishedContent(kind: ContentKind, enabled = true) {
  return useQuery({
    queryKey: ["site-content", kind],
    enabled,
    queryFn: () => publishedContent(kind),
    staleTime: PUBLISHED_CONTENT_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
export async function staffContent(kind: ContentKind): Promise<ContentRow[]> {
  const result = await supabase
    .from("site_content")
    .select("id,kind,draft,published,revision,updated_at")
    .eq("kind", kind)
    .order("updated_at", { ascending: false })
    .abortSignal(AbortSignal.timeout(10000));
  if (result.error) throw new Error("Could not load content. Retry after checking your sign-in.");
  return (result.data ?? []).map((row) => ({
    ...row,
    kind,
    draft: parseContent(kind, row.draft),
    published: row.published ? parseContent(kind, row.published) : null,
  }));
}
export async function saveContent(
  id: string,
  kind: ContentKind,
  revision: number,
  action: "save" | "publish" | "unpublish",
  value: ContentData,
): Promise<ContentRow> {
  const draft = parseContent(kind, value);
  const { data, error } = await supabase
    .rpc("save_site_content", {
      _id: id,
      _kind: kind,
      _revision: revision,
      _action: action,
      _draft: draft,
    })
    .abortSignal(AbortSignal.timeout(15000));
  if (error || !data)
    throw new Error(
      error?.message.includes("changed")
        ? "Another staff member changed this entry. Reload before saving; your text is still here."
        : "Not confirmed. Reload to check the saved version before retrying. Your text is still here.",
    );
  return data as unknown as ContentRow;
}
export async function mediaUrl(path: string) {
  const { data, error } = await supabase.storage.from("site-media").createSignedUrl(path, 600);
  if (error || !data) throw new Error("Photo unavailable.");
  return data.signedUrl;
}
