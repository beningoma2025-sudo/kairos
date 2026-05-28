import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/browse(.*)",
  "/watch(.*)",
  "/kids(.*)",
  "/live(.*)",
  "/channel(.*)",
  "/search(.*)",
  "/account(.*)",
  "/onboarding(.*)",
  "/admin(.*)",
  "/watchlist(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // All protected routes just require authentication.
  // Admin permission is enforced at the API/page level via the DB role (SUPER_ADMIN).
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
