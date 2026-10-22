import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Section } from "@/components/site";

export const Route = createFileRoute("/_authenticated/access-request")({
  head: () => ({
    meta: [
      { title: "Team access request — Pelican" },
      { name: "description", content: "Request access to Pelican's staff tools." },
      { property: "og:title", content: "Team access request — Pelican" },
      { property: "og:description", content: "Request access to Pelican's staff tools." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccessRequest,
});

const copy: Record<string, string> = {
  pending:
    "Your request has been sent. A Pelican administrator will review it in the admin panel. Once approved, sign in again and set up your authenticator to finish.",
  member: "You already have team access.",
  declined: "This request was not approved. Please contact Pelican if you think this is a mistake.",
  error: "Your request could not be sent. Make sure your email is verified, then refresh this page.",
};

function AccessRequest() {
  const [status, setStatus] = useState<string>();
  useEffect(() => {
    void supabase.rpc("request_team_access").then(({ data, error }) => {
      setStatus(error ? "error" : String(data));
      if (data === "member") window.location.assign("/admin");
    });
  }, []);
  return (
    <Section>
      <h1 className="text-4xl">Team access</h1>
      <p role="status" className="mt-5 max-w-xl">
        {status ? copy[status] : "Sending your request…"}
      </p>
    </Section>
  );
}
