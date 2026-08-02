import { NextRequest } from "next/server";

/**
 * Compat : l'upload vidéo client passe par /api/admin/upload/media
 * (même protocole handleUpload + auth admin).
 */
export { POST } from "../media/route";

/** @deprecated Utiliser POST /api/admin/upload/media */
export async function GET(_req: NextRequest) {
  return Response.json(
    {
      success: true,
      data: {
        uploadUrl: "/api/admin/upload/media",
        note: "Utilisez handleUploadUrl: /api/admin/upload/media",
      },
    },
    { status: 200 }
  );
}
