type SidebarAdSlotProps = {
  className?: string;
};

/**
 * A neutral, reusable reservation for future sidebar advertising inventory.
 * It is desktop-only so an empty slot does not interrupt the mobile reading flow.
 */
export default function SidebarAdSlot({ className = '' }: SidebarAdSlotProps) {
  return (
    <aside
      aria-label="Advertisement"
      className={`hidden min-h-[250px] rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center lg:block ${className}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        Advertisement
      </span>
    </aside>
  );
}
