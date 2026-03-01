"use client";

import { useTransition, useCallback } from "react";
import { updateMemberRole } from "@/modules/workspace/actions/update-member-role";
import { removeMember } from "@/modules/workspace/actions/remove-member";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { InviteMemberForm } from "./InviteMemberForm";

interface MembersSectionProps {
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
  workspaceSlug: string;
  currentUserId: string;
}

export function MembersSection({
  members,
  workspaceSlug,
  currentUserId,
}: MembersSectionProps) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = useCallback(
    (memberId: string, role: string) => {
      const formData = new FormData();
      formData.set("memberId", memberId);
      formData.set("role", role);
      startTransition(async () => {
        await updateMemberRole(workspaceSlug, formData);
      });
    },
    [workspaceSlug],
  );

  const handleRemove = useCallback(
    (memberId: string) => {
      startTransition(async () => {
        await removeMember(workspaceSlug, memberId);
      });
    },
    [workspaceSlug],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage who has access to this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="w-32">Role</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const isOwner = m.role === "OWNER";
                const isSelf = m.user.id === currentUserId;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {m.user.image ? (
                          <img
                            src={m.user.image}
                            alt=""
                            className="size-8 rounded-full"
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {(m.user.name ?? m.user.email ?? "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium">
                            {m.user.name ?? "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {m.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-32 align-middle">
                      {isOwner ? (
                        <Badge variant="secondary">OWNER</Badge>
                      ) : (
                        <Select
                          defaultValue={m.role}
                          onValueChange={(val) => handleRoleChange(m.id, val)}
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EDITOR">EDITOR</SelectItem>
                            <SelectItem value="VIEWER">VIEWER</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isOwner && !isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(m.id)}
                          disabled={isPending}
                          title="Remove member"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InviteMemberForm workspaceSlug={workspaceSlug} />
    </div>
  );
}
