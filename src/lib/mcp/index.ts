import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSafaris from "./tools/list-safaris";
import listEnquiries from "./tools/list-enquiries";
import updateEnquiry from "./tools/update-enquiry";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "wanderlust-navigator",
  title: "Wanderlust Navigator",
  version: "0.1.0",
  instructions: "Tools for Pelican Tours and Safaris: read the safari catalogue, and for Pelican staff, review and update Safari Brief enquiries through the pipeline stages.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSafaris, listEnquiries, updateEnquiry],
});
