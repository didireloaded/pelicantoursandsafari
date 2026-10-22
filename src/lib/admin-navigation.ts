export const adminLinks = [
  {
    to: "/admin",
    label: "Overview",
    description: "Your reservations, recent enquiries and next steps.",
  },
  {
    to: "/admin/preview",
    label: "Demo preview",
    description: "Explore a fictional, read-only example of the workspace.",
  },
  {
    to: "/admin/clients",
    label: "Clients",
    description: "Client profiles, countries, sources and recorded spending.",
  },
  {
    to: "/admin/bookings",
    label: "Reservations",
    description: "Bookings, dates and travel calendar.",
  },
  {
    to: "/admin/analytics",
    label: "Analytics",
    description: "Traffic, leads, trip value and audience.",
  },
  {
    to: "/admin/packages",
    label: "Packages",
    description: "Create journeys, itineraries and seasonal prices.",
  },
  { to: "/admin/gallery", label: "Gallery", description: "Destination albums and photographs." },
  {
    to: "/dashboard",
    label: "Enquiries",
    description: "Read, assign and follow up traveller requests.",
  },
  {
    to: "/content-manage",
    label: "Travel information",
    description: "Verified guidance and catalogue details.",
  },
  {
    to: "/admin/team",
    label: "Team",
    description: "Five-seat team access, managed by an administrator.",
  },
  {
    to: "/admin/staff",
    label: "Staff directory",
    description: "Private staff names and profile photos.",
  },
  {
    to: "/admin/profile",
    label: "Your profile",
    description: "Edit your display name and private staff photo.",
  },
  {
    to: "/admin/account",
    label: "Settings",
    description: "Your sign-in, authenticator and account.",
  },
] as const;
