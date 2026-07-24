/**
 * DELETE /api/expenses/:id
 */
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  const { error } = await supabaseServer.from("expenses").delete().eq("id", id);

  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }

  return { success: true };
});
