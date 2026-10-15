"use client";

import {
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Moon,
  ScanSearch,
  ScrollText,
  SlidersHorizontal,
  Sun,
  Trophy,
  Workflow,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState, useSyncExternalStore } from "react";

import { AnimatedCounter } from "@/components/animated-counter";
import { DatasetView } from "@/components/views/dataset-view";
import { DiscoveryView } from "@/components/views/discovery-view";
import { DocsView } from "@/components/views/docs-view";
import { ExportView } from "@/components/views/export-view";
import { ExtractionView } from "@/components/views/extraction-view";
import { FeaturesView } from "@/components/views/features-view";
import { LiveLabView } from "@/components/views/live-lab-view";
import { ModelsView } from "@/components/views/models-view";
import { OverviewView } from "@/components/views/overview-view";
import { PapersView } from "@/components/views/papers-view";
import { PipelineView } from "@/components/views/pipeline-view";
import { ReportView } from "@/components/views/report-view";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLiveRunStore } from "@/lib/live-run-store";
import { VIEW_LABELS, useUiStore } from "@/lib/store";
import type { ViewId } from "@/lib/types";

/** Live-data availability per analytics view (drives the sidebar dots). */
function useViewLiveMap(): Partial<Record<ViewId, boolean>> {
  const papers = useLiveRunStore((s) => s.papers);
  const sentencesTotal = useLiveRunStore((s) => s.sentencesTotal);
  const records = useLiveRunStore((s) => s.records);
  const dataset = useLiveRunStore((s) => s.dataset);
  const features = useLiveRunStore((s) => s.features);
  const folds = useLiveRunStore((s) => s.folds);
  const discovery = useLiveRunStore((s) => s.discoveryTotal);
  return {
    papers: papers.length > 0,
    extraction: sentencesTotal > 0,
    dataset: dataset !== null || records.length > 0,
    features: features !== null,
    models: Object.keys(folds).length > 0,
    discovery: discovery > 0,
  };
}

interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** pipeline stage number shown as a small chip (one-to-one stage mapping) */
  stage?: number;
}

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Live Engine",
    items: [{ id: "live", label: "Live Pipeline Lab", icon: FlaskConical }],
  },
  {
    label: "Pipeline · one-to-one stages",
    items: [
      { id: "pipeline", label: "Pipeline Explorer", icon: Workflow },
      { id: "papers", label: "Papers", icon: BookOpen, stage: 1 },
      { id: "extraction", label: "Extraction", icon: ScanSearch, stage: 3 },
      { id: "dataset", label: "Dataset", icon: Database, stage: 5 },
      { id: "features", label: "Features", icon: SlidersHorizontal, stage: 7 },
      { id: "models", label: "Models", icon: Trophy, stage: 8 },
      { id: "discovery", label: "Discovery", icon: FlaskConical, stage: 9 },
    ],
  },
  {
    label: "Analytics",
    items: [{ id: "overview", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Output",
    items: [
      { id: "report", label: "Report Builder", icon: ScrollText },
      { id: "export", label: "Export Center", icon: Download },
    ],
  },
  {
    label: "Reference",
    items: [{ id: "docs", label: "Docs & About", icon: BookMarked }],
  },
];

const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

const VIEW_COMPONENTS: Record<ViewId, React.ComponentType> = {
  live: LiveLabView,
  overview: OverviewView,
  pipeline: PipelineView,
  papers: PapersView,
  extraction: ExtractionView,
  dataset: DatasetView,
  features: FeaturesView,
  models: ModelsView,
  discovery: DiscoveryView,
  report: ReportView,
  export: ExportView,
  docs: DocsView,
};

const emptySubscribe = () => () => {};

/**
 * Hydration-safe mounted flag without setState-in-effect: the server and the
 * hydration render report false; the client reports true afterwards.
 */
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = resolvedTheme === "dark";
  // Static label until mounted so SSR HTML always matches the first client
  // render (next-themes resolves the theme only on the client).
  const ariaLabel = !mounted ? "Toggle color theme" : isDark ? "Switch to light theme" : "Switch to dark theme";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-5 w-5 text-amber-400" aria-hidden="true" />
        ) : (
          <Moon className="h-5 w-5 text-slate-600" aria-hidden="true" />
        )
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </Button>
  );
}

function NavButton({
  item,
  collapsed,
  active,
  hasLiveData,
  onSelect,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  hasLiveData?: boolean;
  onSelect: () => void;
}) {
  const Icon = item.icon;
  const button = (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        active
          ? "bg-primary/15 text-emerald-500 dark:text-emerald-400"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      } ${collapsed ? "justify-center" : ""}`}
    >
      {active ? (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-emerald-500"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      ) : null}
      <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
      {collapsed ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <>
          {item.stage ? (
            <span className="shrink-0 rounded bg-secondary px-1 py-0.5 font-mono text-[9px] font-semibold text-muted-foreground/80">
              {String(item.stage).padStart(2, "0")}
            </span>
          ) : null}
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {hasLiveData ? (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
              title="live run data available"
              aria-label="live run data available"
            />
          ) : null}
        </>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return button;
}

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const liveMap = useViewLiveMap();

  return (
    <nav aria-label="Primary navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {collapsed ? (
            <div className="mx-auto mb-2 h-px w-8 bg-border" />
          ) : (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              {group.label}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                collapsed={collapsed}
                active={view === item.id}
                hasLiveData={liveMap[item.id]}
                onSelect={() => {
                  setView(item.id);
                  onNavigate?.();
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="border-t border-sidebar-border px-3 py-3">
      <div
        className={`flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-600 dark:text-emerald-400 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
        {collapsed ? null : (
          <p className="text-[11px] font-medium leading-snug">
            Verified run · 18/18 cells · 0 errors
          </p>
        )}
      </div>
    </div>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center gap-3 border-b border-sidebar-border px-4 py-4`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
        <FlaskConical className="h-5 w-5 text-white" aria-hidden="true" />
      </div>
      {collapsed ? null : (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-sidebar-foreground">
            MatSciML Discovery
          </p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">Capstone 24041_103</p>
        </div>
      )}
    </div>
  );
}

function MobileNav() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);
  const view = useUiStore((s) => s.view);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <div className="flex h-full flex-col bg-sidebar">
          <Brand collapsed={false} />
          <SidebarNav collapsed={false} onNavigate={() => setOpen(false)} />
          <SidebarFooter collapsed={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DesktopSidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 264 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex"
    >
      <Brand collapsed={collapsed} />
      <SidebarNav collapsed={collapsed} />
      <SidebarFooter collapsed={collapsed} />
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full justify-center text-muted-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}

function Header() {
  const view = useUiStore((s) => s.view);
  const item = ALL_ITEMS.find((i) => i.id === view);
  const Icon = item?.icon ?? LayoutDashboard;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <MobileNav />
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-emerald-600 dark:text-emerald-400">
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {VIEW_LABELS[view]}
            </h2>
            <p className="hidden truncate font-mono text-[10px] text-muted-foreground sm:block">
              MatSciML Discovery · 24041_103
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <a
            href="https://doi.org/10.1038/s41524-025-01554-0"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-emerald-500 md:block"
            aria-label="Base paper: Jiang et al. 2025, npj Computational Materials (opens in new tab)"
          >
            Base paper · Jiang 2025 ↗
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background/60 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <p>
          <span className="font-semibold text-foreground">MatSciML Discovery</span> · Capstone
          24041_103 · NLP + LLM to New Materials Prediction Platform
        </p>
        <p className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Data from verified 24041_103_RUN_ALL.ipynb run
          </span>
          <a
            href="https://doi.org/10.1038/s41524-025-01554-0"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-emerald-500 hover:underline"
          >
            npj Comput. Mater. 11:79
          </a>
        </p>
      </div>
    </footer>
  );
}

export function AppShell() {
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const ViewComponent = VIEW_COMPONENTS[view];

  // Keyboard shortcuts: ⌥/Alt + ArrowLeft/Right to switch views.
  useEffect(() => {
    const index = ALL_ITEMS.findIndex((i) => i.id === view);
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight" && index < ALL_ITEMS.length - 1) {
        setView(ALL_ITEMS[index + 1].id);
      } else if (event.key === "ArrowLeft" && index > 0) {
        setView(ALL_ITEMS[index - 1].id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, setView]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex flex-1">
          <DesktopSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main
              id="main-content"
              className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 14, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.995 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ViewComponent />
                </motion.div>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export { AnimatedCounter };
