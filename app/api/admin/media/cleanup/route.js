import { discardMedia } from "../../../../../controllers/media.controller";

export async function POST(request) {
  return discardMedia(request);
}
