import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(async (request: Request) => {
  const { auth } = await import("@/lib/auth");
  return auth.handler(request);
});
