export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/meminhaj/:path*", "/profile/:path*"],
};
