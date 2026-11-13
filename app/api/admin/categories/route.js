import { createCategory, listCategories } from "../../../../controllers/category.controller";

export async function GET() {
  return listCategories();
}

export async function POST(request) {
  return createCategory(request);
}
