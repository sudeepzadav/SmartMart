"use client";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
};

export default function PageHeader({
  title,
  subtitle,
  action,
  onAction,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#7d0e41]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#6b4455]">{subtitle}</p>}
      </div>

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-md bg-[#7d0e41] px-4 py-2 font-semibold text-white hover:bg-[#aa5e78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
        >
          {action}
        </button>
      )}
    </div>
  );
}