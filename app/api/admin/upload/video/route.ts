import { POST as blobPost } from "../blob/route";

/** Compat : délègue à /api/admin/upload/blob */
export const POST = blobPost;
