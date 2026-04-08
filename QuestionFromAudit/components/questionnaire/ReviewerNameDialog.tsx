"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ReviewerNameDialogProps {
  open: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export default function ReviewerNameDialog({
  open,
  onSubmit,
  onClose,
}: ReviewerNameDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Before you begin</DialogTitle>
          <DialogDescription>
            Enter your name so your feedback can be attributed. This is saved
            for the rest of your session.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label htmlFor="reviewer-name">Your name</Label>
          <Input
            id="reviewer-name"
            placeholder="e.g. Dr. Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
