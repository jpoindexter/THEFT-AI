import { AlertTriangle } from "lucide-react";
import type { AdapterInfo } from "@/api/adapters";
import { AdapterRow } from "./AdapterRow";
import { EmptyExternalAdapters, AdapterSectionHeading } from "./AdapterSectionPrimitives";
import { toVirtualAdapterInfo, type VirtualBuiltinAdapter } from "./adapterManagerModel";

export function AdapterAlphaNotice() {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">External adapters are alpha.</p>
          <p className="text-muted-foreground">
            The adapter plugin system is under active development. APIs and storage format may change.
            Use the power icon to hide adapters from agent menus without removing them.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ExternalAdaptersSection({
  adapters,
  onToggle,
  onOverrideToggle,
  onRemove,
  onReload,
  onReinstall,
  isToggling,
  isOverrideToggling,
  isReloading,
  isReinstalling,
}: {
  adapters: AdapterInfo[];
  onToggle: (type: string, disabled: boolean) => void;
  onOverrideToggle: (type: string, paused: boolean) => void;
  onRemove: (type: string) => void;
  onReload: (type: string) => void;
  onReinstall: (adapter: AdapterInfo) => void;
  isToggling: boolean;
  isOverrideToggling: boolean;
  isReloading: boolean;
  isReinstalling: boolean;
}) {
  return (
    <section className="space-y-3">
      <AdapterSectionHeading title="External Adapters" />
      {adapters.length === 0 ? (
        <EmptyExternalAdapters />
      ) : (
        <ul className="divide-y rounded-md border bg-card">
          {adapters.map((adapter) => {
            const isBuiltinOverride = !!adapter.overriddenBuiltin;
            const effectiveAdapter = isBuiltinOverride
              ? { ...adapter, disabled: !!adapter.overridePaused }
              : adapter;

            return (
              <AdapterRow
                key={adapter.type}
                adapter={effectiveAdapter}
                canRemove={true}
                onToggle={isBuiltinOverride ? onOverrideToggle : onToggle}
                onRemove={onRemove}
                onReload={onReload}
                onReinstall={!adapter.isLocalPath ? () => onReinstall(adapter) : undefined}
                isToggling={isBuiltinOverride ? isOverrideToggling : isToggling}
                isReloading={isReloading}
                isReinstalling={isReinstalling}
                toggleTitleDisabled={isBuiltinOverride ? "Pause external override" : undefined}
                toggleTitleEnabled={isBuiltinOverride ? "Resume external override" : undefined}
                disabledBadgeLabel={isBuiltinOverride ? "Override paused" : undefined}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function BuiltinAdaptersSection({
  adapters,
  overriddenBuiltins,
  isMutating,
  onToggle,
}: {
  adapters: AdapterInfo[];
  overriddenBuiltins: VirtualBuiltinAdapter[];
  isMutating: boolean;
  onToggle: (type: string, disabled: boolean) => void;
}) {
  return (
    <section className="space-y-3">
      <AdapterSectionHeading title="Built-in Adapters" />
      {adapters.length === 0 && overriddenBuiltins.length === 0 ? (
        <div className="text-sm text-muted-foreground">No built-in adapters found.</div>
      ) : (
        <ul className="divide-y rounded-md border bg-card">
          {adapters.map((adapter) => (
            <AdapterRow
              key={adapter.type}
              adapter={adapter}
              canRemove={false}
              onToggle={onToggle}
              onRemove={() => {}}
              isToggling={isMutating}
            />
          ))}
          {overriddenBuiltins.map((adapter) => (
            <AdapterRow
              key={adapter.type}
              adapter={toVirtualAdapterInfo(adapter)}
              canRemove={false}
              onToggle={onToggle}
              onRemove={() => {}}
              isToggling={isMutating}
              overriddenBy={adapter.overridePaused ? undefined : adapter.overriddenBy}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
