"use client";

import { type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface SystemTab {
    value: string;
    label: string;
    count?: number;
    content: ReactNode;
}

interface SystemDetailTabsProps {
    tabs: SystemTab[];
    defaultTab?: string;
}

export function SystemDetailTabs({ tabs, defaultTab }: SystemDetailTabsProps) {
    const visibleTabs = tabs.filter((t) => t.content !== null);
    const initial = defaultTab ?? visibleTabs[0]?.value ?? "overview";

    return (
        <Tabs defaultValue={initial} className="flex flex-col gap-4">
            <TabsList>
                {visibleTabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label}
                        {tab.count != null && tab.count > 0 && (
                            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-[0.625rem] font-medium leading-none tabular-nums">
                                {tab.count}
                            </span>
                        )}
                    </TabsTrigger>
                ))}
            </TabsList>

            {visibleTabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                    {tab.content}
                </TabsContent>
            ))}
        </Tabs>
    );
}
