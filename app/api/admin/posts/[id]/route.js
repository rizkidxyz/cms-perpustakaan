import { deletePost, getAdminPost, updatePost } from "../../../../../controllers/post.controller";

export async function GET(request, { params }) {
  const { id } = await params;
  return getAdminPost(request, id);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  return updatePost(request, id);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  return deletePost(request, id);
}
