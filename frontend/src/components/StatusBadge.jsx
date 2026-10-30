/** Application status → badge style */
export default function StatusBadge({ status }) {
  const config = {
    eligible:    { label: "Eligible",    cls: "badge-blue"   },
    applied:     { label: "Applied",     cls: "badge-purple" },
    shortlisted: { label: "Shortlisted", cls: "badge-yellow" },
    round_1:     { label: "Round 1",     cls: "badge-yellow" },
    round_2:     { label: "Round 2",     cls: "badge-yellow" },
    round_3:     { label: "Round 3",     cls: "badge-yellow" },
    selected:    { label: "Selected ✓",  cls: "badge-green"  },
    rejected:    { label: "Rejected",    cls: "badge-red"    },
    withdrawn:   { label: "Withdrawn",   cls: "badge-gray"   },
    // Drive statuses
    draft:        { label: "Draft",        cls: "badge-gray"   },
    open:         { label: "Open",         cls: "badge-green"  },
    closed:       { label: "Closed",       cls: "badge-red"    },
    shortlisting: { label: "Shortlisting", cls: "badge-yellow" },
    scheduled:    { label: "Scheduled",    cls: "badge-blue"   },
    completed:    { label: "Completed",    cls: "badge-gray"   },
    // Slot statuses
    no_show:     { label: "No Show",     cls: "badge-red"    },
    rescheduled: { label: "Rescheduled", cls: "badge-yellow" },
  };

  const { label, cls } = config[status] ?? { label: status, cls: "badge-gray" };
  return <span className={cls}>{label}</span>;
}
