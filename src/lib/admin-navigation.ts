export const adminLinks = [
  { to: "/admin", section: "WORKSPACE", label: "Overview", description: "Upcoming trips, enquiries and daily priorities." },
  { to: "/dashboard", section: "WORKSPACE", label: "Enquiries", description: "Incoming requests, follow-ups and traveller briefs." },
  { to: "/admin/clients", section: "WORKSPACE", label: "Clients", description: "Client profiles, origins and linked journeys." },
  { to: "/admin/bookings", section: "WORKSPACE", label: "Reservations", description: "Booking records, dates and travel calendar." },
  { to: "/trips-manage", section: "WORKSPACE", label: "Trip management", description: "Maintain traveller-assigned trips and itineraries." },
  { to: "/admin/analytics", section: "WORKSPACE", label: "Analytics", description: "Traffic, enquiries, trip values and audience." },
  { to: "/admin/packages", section: "WEBSITE CONTENT", label: "Packages", description: "Draft and publish safari packages." },
  { to: "/admin/gallery", section: "WEBSITE CONTENT", label: "Gallery", description: "Destination albums and images." },
  { to: "/content-manage", section: "WEBSITE CONTENT", label: "Travel information", description: "Review facts and catalogue details." },
  { to: "/admin/team", section: "PEOPLE & ACCESS", label: "Team", description: "Staff profiles, roles and permissions." },
  { to: "/admin/profile", section: "PEOPLE & ACCESS", label: "Your profile", description: "Your display name and staff photo." },
  { to: "/admin/account", section: "PEOPLE & ACCESS", label: "Settings", description: "Sign-in and authenticator settings." },
] as const;
