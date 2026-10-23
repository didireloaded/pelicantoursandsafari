import { useState } from "react";
import { sampleStaff } from "@/lib/admin-sample-data";

export function SampleTeam() {
  const [selected, setSelected] = useState<string>(sampleStaff[0].id);
  const current = sampleStaff.find((member) => member.id === selected);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">PEOPLE & ACCESS</p>
          <h1 className="mt-2">Team</h1>
          <p>Staff profiles, responsibilities and access levels in one place.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sampleStaff.map((member, index) => (
          <button
            key={member.id}
            type="button"
            aria-pressed={selected === member.id}
            className="admin-panel p-5 text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => setSelected(member.id)}
          >
            <span
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border text-xl font-semibold text-primary"
              style={{ backgroundColor: index % 2 ? "var(--secondary)" : "var(--background)" }}
              aria-label={`Example avatar for ${member.name}`}
            >
              {member.initials}
            </span>
            <strong className="block text-base">{member.name}</strong>
            <span className="mt-1 block text-xs text-muted-foreground">{member.title}</span>
            <span className="admin-status mt-4 inline-block">{member.role}</span>
            <span className="mt-4 block text-xs text-primary">View profile →</span>
          </button>
        ))}
      </div>
      {current && (
        <section className="admin-panel mt-6 max-w-3xl p-6" aria-label="Selected team member">
          <p className="admin-eyebrow">TEAM MEMBER DETAILS</p>
          <h2 className="mt-2 text-xl font-semibold">{current.name}</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Access</dt>
              <dd className="mt-1 font-medium">{current.role}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Responsibility</dt>
              <dd className="mt-1 font-medium">{current.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sample contact</dt>
              <dd className="mt-1">{current.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Account status</dt>
              <dd className="mt-1">Presentation record only</dd>
            </div>
          </dl>
          <p className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
            {current.bio}
          </p>
        </section>
      )}
    </>
  );
}
