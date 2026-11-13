import * as React from "react";
import { Drawer } from "vaul";

import { cn } from "@/lib/utils";

/** Bottom sheet: slides up from the bottom, paper surface, rounded top. */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false} direction="bottom">
      <Drawer.Content className="mt-24 flex h-auto flex-col rounded-t-[32px] border-t-2 border-line bg-paper outline-none">
        <div className="mx-auto mt-4 h-1.5 w-14 shrink-0 rounded-full bg-line" />
        <Drawer.Title className="px-6 pt-5 font-display text-2xl font-bold text-ink">
          {title}
        </Drawer.Title>
        {description ? (
          <Drawer.Description className="px-6 pt-1 text-base text-muted-text">
            {description}
          </Drawer.Description>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="border-t-2 border-line bg-paper px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </Drawer.Content>
    </Drawer>
  );
}

export const BottomSheetClose = Drawer.Close;
