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
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { conversation_id, sender_id, message_content } = await req.json();

    if (!conversation_id || !sender_id || !message_content) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get conversation participants
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversation_id);

    if (!participants || participants.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no participants" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find supervisors in the conversation (not the sender)
    const supervisorParticipants = participants.filter(
      (p: any) => p.user_role === "supervisor" && p.user_id !== sender_id
    );

    if (supervisorParticipants.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no supervisor" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get sender info
    const senderParticipant = participants.find((p: any) => p.user_id === sender_id);
    const senderName = senderParticipant?.user_name || "A student";

    // Get conversation reply_token
    const { data: conv } = await supabase
      .from("conversations")
      .select("reply_token")
      .eq("id", conversation_id)
      .single();

    const replyToken = conv?.reply_token || "";

    // Check each supervisor's online status and send email if offline
    for (const sup of supervisorParticipants) {
      // Look up supervisor email from predefined accounts or user_accounts
      const { data: account } = await supabase
        .from("user_accounts")
        .select("email, last_seen_at")
        .eq("id", sup.user_id)
        .single();

      // If no account found, try to find email from predefined data
      let supervisorEmail = account?.email;
      const lastSeenAt = account?.last_seen_at;

      // Check if supervisor is online (seen in last 2 minutes)
      if (lastSeenAt) {
        const lastSeen = new Date(lastSeenAt).getTime();
        const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
        if (lastSeen > twoMinutesAgo) {
          console.log(`Supervisor ${sup.user_name} is online, skipping email`);
          continue;
        }
      }

      if (!supervisorEmail) {
        // Fallback: check hardcoded supervisors
        const hardcoded: Record<string, string> = {
          "supervisor-01": "martin.vechev@ethz.ch",
        };
        supervisorEmail = hardcoded[sup.user_id];
      }

      if (!supervisorEmail) {
        console.log(`No email for supervisor ${sup.user_id}`);
        continue;
      }

      // Build reply-to address
      const replyToEmail = replyToken
        ? `reply+${replyToken}@studyond.com`
        : undefined;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">New message from ${senderName}</h2>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #333;">${message_content.replace(/\n/g, "<br>")}</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            You can reply directly to this email — your response will be sent straight to the chat with ${senderName} on StudyOnd.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">
            ⚠️ Note: Your reply to this email will be delivered directly as a chat message to ${senderName}. 
            Do not include any confidential information you wouldn't want in the chat.
          </p>
        </div>
      `;

      const emailPayload: any = {
        from: "StudyOnd <notifications@studyond.com>",
        to: [supervisorEmail],
        subject: `New message from ${senderName} — StudyOnd`,
        html: emailHtml,
      };

      if (replyToEmail) {
        emailPayload.reply_to = replyToEmail;
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      const result = await res.json();
      if (!res.ok) {
        console.error(`Failed to send email to ${supervisorEmail}:`, result);
      } else {
        console.log(`Email sent to ${supervisorEmail}:`, result);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-supervisor:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
