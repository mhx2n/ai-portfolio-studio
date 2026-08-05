import { supabase } from "@/integrations/supabase/client";
import type { MediaItem } from "./portfolio-types";

export const MEDIA_BUCKET = "portfolio-media";

export async function uploadMedia(userId: string, file: File): Promise<MediaItem> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  return {
    path,
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
  };
}
