import { serveMedia } from "../../../../controllers/media.controller";

export async function GET(request, { params }) {
  const { path: segments } = await params;
  return serveMedia(request, segments);
}
