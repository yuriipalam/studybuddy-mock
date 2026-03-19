import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resend inbound webhook payload
    const payload = await req.json();
    console.log("Inbound email payload:", JSON.stringify(payload));

    // Extract reply token from the "to" address
    // Format: reply+{token}@studyond.com
    const toAddresses: string[] = Array.isArray(payload.to)
      ? payload.to
      : [payload.to];

    let replyToken: string | null = null;
    for (const addr of toAddresses) {
      const match = addr.match(/reply\+([a-f0-9]+)@/i);
      if (match) {
        replyToken = match[1];
        break;
      }
    }

    if (!replyToken) {
      console.error("No reply token found in to addresses:", toAddresses);
      return new Response(JSON.stringify({ error: "No reply token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find conversation by reply_token
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("reply_token", replyToken)
      .single();

    if (convError || !conv) {
      console.error("Conversation not found for token:", replyToken);
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the supervisor's user_id by matching the from email
    const fromEmail = typeof payload.from === "string"
      ? payload.from.replace(/.*</, "").replace(/>.*/, "").trim()
      : payload.from;

    // Look up the user by email
    const { data: userAccount } = await supabase
      .from("user_accounts")
      .select("id")
      .eq("email", fromEmail)
      .single();

    // Fallback: check conversation participants
    let senderId = userAccount?.id;

    if (!senderId) {
      // Try matching from hardcoded supervisor emails
      const hardcoded: Record<string, string> = {
        "martin.vechev@ethz.ch": "supervisor-01",
      };
      senderId = hardcoded[fromEmail];
    }

    if (!senderId) {
      // Last resort: find supervisor participant in this conversation
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id, user_role")
        .eq("conversation_id", conv.id)
        .eq("user_role", "supervisor");

      senderId = participants?.[0]?.user_id;
    }

    if (!senderId) {
      console.error("Could not identify sender for email:", fromEmail);
      return new Response(JSON.stringify({ error: "Unknown sender" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the reply text (strip quoted content)
    let messageText = payload.text || payload.html || "";

    // Clean up: remove quoted email text (lines starting with > or after "On ... wrote:")
    if (typeof messageText === "string") {
      // Remove everything after "On ... wrote:" pattern
      messageText = messageText.split(/\nOn .+wrote:\n/)[0];
      // Remove lines starting with >
      messageText = messageText
        .split("\n")
        .filter((line: string) => !line.startsWith(">"))
        .join("\n")
        .trim();
    }

    if (!messageText) {
      console.log("Empty reply content, skipping");
      return new Response(JSON.stringify({ skipped: true, reason: "empty" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert message into the conversation
    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: senderId,
      content: messageText,
    });

    if (insertError) {
      console.error("Failed to insert message:", insertError);
      return new Response(JSON.stringify({ error: "Failed to insert message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Email reply inserted into conversation ${conv.id} from ${senderId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in inbound-email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
