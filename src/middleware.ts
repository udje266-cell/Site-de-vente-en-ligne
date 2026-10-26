import { withAuth } from "next-auth/middleware";

/** Protège /admin (sauf la page de connexion). Les pages et actions revérifient la session côté serveur. */
export default withAuth({ pages: { signIn: "/admin/connexion" } });

export const config = { matcher: ["/admin/((?!connexion).*)", "/admin"] };
