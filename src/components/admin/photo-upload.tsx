import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ContentPhoto } from "@/components/content-photo";
/** Decode and re-encode to strip metadata, reject SVG/animation and bound published image size. */
async function preparePhoto(file: File): Promise<Blob> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 12 * 1024 * 1024
  )
    throw new Error("Choose a JPEG, PNG or WebP photo under 12 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 50000000)
      throw new Error("This photo is too large. Resize it first.");
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Photo processing unavailable in this browser.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("Could not prepare photo."))),
        "image/webp",
        0.82,
      ),
    );
    if (blob.type !== "image/webp" || blob.size > 5 * 1024 * 1024)
      throw new Error("Resize the photo before uploading.");
    return blob;
  } finally {
    bitmap.close();
  }
}
export function PhotoUpload({
  userId,
  path,
  onChange,
  onBusy,
}: {
  userId: string;
  path: string | null;
  onChange: (path: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  return (
    <div className="space-y-4">
      <label className="block">
        Upload photograph
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          className="mt-3 block w-full text-sm"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file || lock.current) return;
            lock.current = true;
            setBusy(true);
            onBusy(true);
            setMessage("");
            try {
              const blob = await preparePhoto(file);
              const next = `${userId}/${crypto.randomUUID()}.webp`;
              const result = await supabase.storage
                .from("site-media")
                .upload(next, blob, { contentType: "image/webp", upsert: false });
              if (result.error)
                throw new Error("Upload not confirmed. Check your sign-in and retry.");
              onChange(next);
              setMessage(
                "Photo uploaded privately. Save and publish the entry to show it on the website.",
              );
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Photo could not be uploaded.");
            } finally {
              lock.current = false;
              setBusy(false);
              onBusy(false);
              event.target.value = "";
            }
          }}
        />
      </label>
      <p className="text-sm text-muted-foreground">
        JPEG, PNG or WebP, up to 12 MB. We resize to 1920 pixels and remove embedded metadata.
        Upload only photos you have permission to publish.
      </p>
      <p role="status">{busy ? "Preparing and uploading photo…" : message}</p>
      {path && <ContentPhoto path={path} alt="Uploaded photograph preview" />}
    </div>
  );
}
