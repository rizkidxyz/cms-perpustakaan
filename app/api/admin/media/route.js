import { uploadMedia } from "../../../../controllers/media.controller";

export async function POST(request) {
  return uploadMedia(request);
}
