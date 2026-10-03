import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "npm:@supabase/supabase-js/cors";
import { withSupabase } from "npm:@supabase/server";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const userId = ctx.userClaims?.id;
    if (!userId) {
      return Response.json({ code: "AUTH_USER_REQUIRED" }, { status: 401, headers: corsHeaders });
    }

    const { error } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId, false);
    if (error) {
      console.error("Kanji 5 account deletion failed", { code: error.code ?? null });
      return Response.json(
        { code: "ACCOUNT_DELETE_FAILED" },
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return Response.json(
      { deleted: true },
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }),
};
