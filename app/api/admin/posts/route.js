import { createPost, listAdminPosts } from "../../../../controllers/post.controller";

export async function GET(request) {
  return listAdminPosts(request);
}

export async function POST(request) {
  return createPost(request);
}
