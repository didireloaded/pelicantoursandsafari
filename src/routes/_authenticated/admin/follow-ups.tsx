import { createFileRoute } from "@tanstack/react-router";
import { FollowUps } from "@/components/admin/follow-ups";

export const Route = createFileRoute("/_authenticated/admin/follow-ups")({ component: FollowUps });
