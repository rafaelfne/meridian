"use client";

import { useState, useTransition, useCallback } from "react";
import { inviteMember } from "@/modules/workspace/actions/invite-member";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface InviteMemberFormProps {
  workspaceSlug: string;
}

export function InviteMemberForm({ workspaceSlug }: InviteMemberFormProps) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const formData = new FormData();
      formData.set("email", email);
      formData.set("role", role);

      startTransition(async () => {
        const result = await inviteMember(workspaceSlug, formData);
        if (result.success) {
          setEmail("");
          setErrors({});
          toast.success("Member added");
        } else {
          setErrors(result.error ?? {});
        }
      });
    },
    [email, role, workspaceSlug],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite member</CardTitle>
        <CardDescription>
          Add a team member by their email address. They must already have an
          account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-[1fr_7rem_auto] items-end gap-3">
            <div className="space-y-1">
              <label
                htmlFor="invite-email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="mb-1"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Role
              </label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDITOR">EDITOR</SelectItem>
                  <SelectItem value="VIEWER">VIEWER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isPending} className="mb-1">
              {isPending ? "Inviting..." : "Invite"}
            </Button>
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email[0]}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
