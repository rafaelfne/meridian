"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Loader2, X } from "lucide-react";

interface UserResult {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface UserSearchComboboxProps {
  workspaceSlug: string;
  value: UserResult | null;
  onChange: (user: UserResult | null) => void;
}

export function UserSearchCombobox({
  workspaceSlug,
  value,
  onChange,
}: UserSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/w/${workspaceSlug}/users/search?q=${encodeURIComponent(q)}`,
        );
        if (res.ok) {
          const data: UserResult[] = await res.json();
          setResults(data);
        }
      } finally {
        setLoading(false);
      }
    },
    [workspaceSlug],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const displayLabel = value
    ? value.name ?? value.email ?? "User selected"
    : "Search user...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              {value.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={value.image}
                  alt=""
                  className="size-5 shrink-0 rounded-full"
                />
              ) : (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                  {(value.name ?? value.email ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
              <span className="truncate">{displayLabel}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{displayLabel}</span>
          )}
          {value ? (
            <X
              className="ml-auto size-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            />
          ) : (
            <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or email..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <CommandEmpty>No users found.</CommandEmpty>
            )}
            {!loading && query.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </div>
            )}
            {!loading && results.length > 0 && (
              <CommandGroup>
                {results.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => {
                      onChange(user);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt=""
                          className="size-6 rounded-full"
                        />
                      ) : (
                        <div className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {(user.name ?? user.email ?? "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {user.name ?? "—"}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
