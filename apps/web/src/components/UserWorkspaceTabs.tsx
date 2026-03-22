type UserTab = "training" | "focus" | "settings";

type UserWorkspaceTabsProps = {
  activeTab: UserTab;
  onChange: (tab: UserTab) => void;
};

const tabs: Array<{ key: UserTab; label: string }> = [
  { key: "training", label: "Training" },
  { key: "focus", label: "Focus" },
  { key: "settings", label: "Settings" },
];

export function UserWorkspaceTabs({
  activeTab,
  onChange,
}: UserWorkspaceTabsProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-slate-100 text-slate-950"
                : "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
