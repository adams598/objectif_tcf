"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<unknown>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  destructive = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            className={cn(destructive && "bg-error hover:bg-error/90")}
            disabled={loading}
            onClick={() => void onConfirm()}
          >
            {loading ? "En cours…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<unknown>;
};

export function useConfirmDialog() {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = React.useState(false);

  const confirm = React.useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
  }, []);

  const close = React.useCallback(() => {
    if (!loading) setOptions(null);
  }, [loading]);

  const handleConfirm = React.useCallback(async () => {
    if (!options) return;
    setLoading(true);
    try {
      await options.onConfirm();
      setOptions(null);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const dialog = (
    <ConfirmDialog
      open={!!options}
      onOpenChange={(open) => !open && close()}
      title={options?.title ?? ""}
      description={options?.description}
      confirmLabel={options?.confirmLabel}
      cancelLabel={options?.cancelLabel}
      destructive={options?.destructive}
      loading={loading}
      onConfirm={handleConfirm}
    />
  );

  return { confirm, dialog };
}
