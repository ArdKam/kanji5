import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@1";

export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    const userId = ctx.userClaims?.id;
    if (!userId) {
      return Response.json({ code: "AUTH_USER_REQUIRED" }, { status: 401 });
    }

    const { error } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId, false);
    if (error) {
      console.error("Kanji 5 account deletion failed", { code: error.code ?? null });
      return Response.json({ code: "ACCOUNT_DELETE_FAILED" }, { status: 500 });
    }

    return Response.json({ deleted: true });
  }),
};
