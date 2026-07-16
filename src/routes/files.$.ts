import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getStorage, contentTypeFor } from "@/lib/server/storage";
import { getSessionUser } from "@/lib/server/auth";

// Streams a stored invoice/proof file. Only signed-in users may download.
export const Route = createFileRoute("/files/$")({
  server: {
    handlers: {
      GET: async ({ params }: { params: { _splat?: string } }) => {
        const user = await getSessionUser();
        if (!user) return new Response("Unauthorized", { status: 401 });

        const relPath = params._splat ?? "";
        if (!relPath) return new Response("Not found", { status: 404 });
        try {
          const { data, name } = await getStorage().read(relPath);
          return new Response(new Uint8Array(data), {
            headers: {
              "Content-Type": contentTypeFor(name),
              "Content-Disposition": `inline; filename="${name}"`,
              "Cache-Control": "private, max-age=60",
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
