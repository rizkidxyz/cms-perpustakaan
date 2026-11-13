import { logoutController } from "../../../../controllers/auth.controller";

export async function POST(request) {
  return logoutController(request);
}
