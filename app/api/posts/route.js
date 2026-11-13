import { connection } from "next/server";
import { listPublicPosts } from "../../../controllers/post.controller";

export async function GET(request) {
  // GET Route Handlers can be prerendered with cacheComponents.
  // This endpoint reads query parameters from the incoming request.
  await connection();
  return listPublicPosts(request);
}
