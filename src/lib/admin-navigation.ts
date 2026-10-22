export const adminLinks = [
  { to: "/admin", label: "Home", description: "Choose what you want to update." },
  {
    to: "/admin/packages",
    label: "Packages",
    description: "Create journeys, itineraries and seasonal prices.",
  },
  { to: "/admin/gallery", label: "Gallery", description: "Upload photos to destination albums." },
  { to: "/dashboard", label: "Enquiries", description: "Read and follow up traveller requests." },
  {
    to: "/content-manage",
    label: "Travel information",
    description: "Maintain verified guidance and existing safari details.",
  },
  { to: "/admin/account", label: "Account", description: "Manage your sign-in and security." },
] as const;
