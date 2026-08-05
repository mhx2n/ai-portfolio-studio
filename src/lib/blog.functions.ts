import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getBlogIndex = createServerFn({ method: "GET" }).handler(async () => {
  const { loadBlogSettings, loadPublishedPosts } = await import("./blog.server");
  const [settings, posts] = await Promise.all([loadBlogSettings(), loadPublishedPosts()]);
  return { settings, posts };
});

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(96) }).parse(data))
  .handler(async ({ data }) => {
    const { loadBlogSettings, loadPublishedPost, bumpPostViews } = await import("./blog.server");
    const [settings, post] = await Promise.all([loadBlogSettings(), loadPublishedPost(data.slug)]);
    if (post) await bumpPostViews(data.slug);
    return { settings, post };
  });
