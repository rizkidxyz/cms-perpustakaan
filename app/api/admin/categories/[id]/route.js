import { deleteCategory, updateCategory } from "../../../../../controllers/category.controller";

export async function PATCH(request, { params }) {
  const { id } = await params;
  return updateCategory(request, id);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  return deleteCategory(request, id);
}
