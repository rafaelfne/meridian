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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserSearchCombobox } from "./UserSearchCombobox";

interface UserResult {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface InviteMemberFormProps {
  workspaceSlug: string;
}

export function InviteMemberForm({ workspaceSlug }: InviteMemberFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [role, setRole] = useState("EDITOR");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedUser) {
        setErrors({ userId: ["Select a user to invite."] });
        return;
      }

      const formData = new FormData();
      formData.set("userId", selectedUser.id);
      formData.set("role", role);

      startTransition(async () => {
        const result = await inviteMember(workspaceSlug, formData);
        if (result.success) {
          setSelectedUser(null);
          setErrors({});
          toast.success("Member added");
        } else {
          setErrors(result.error ?? {});
        }
      });
    },
    [selectedUser, role, workspaceSlug],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite member</CardTitle>
        <CardDescription>
          Search for a user by name or email to add them to this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-[1fr_7rem_auto] items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                User
              </label>
              <UserSearchCombobox
                workspaceSlug={workspaceSlug}
                value={selectedUser}
                onChange={setSelectedUser}
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
            <Button
              type="submit"
              disabled={isPending || !selectedUser}
              className="mb-1"
            >
              {isPending ? "Inviting..." : "Invite"}
            </Button>
          </div>
          {errors.userId && (
            <p className="text-sm text-destructive">{errors.userId[0]}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
