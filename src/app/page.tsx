"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { AddLinkDialog } from "@/components/add-link-dialog";
import { LinkCard } from "@/components/link-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { signOut } from "@/lib/auth-client";
import SignIn from "@/components/sign-in";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isLoading } = useAuth();

  const links = useQuery(
    api.links.search,
    user ? { query: searchQuery, userId: user.id as Id<"users"> } : "skip"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <SignIn />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col space-y-6">
          <header className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold mb-2">🍞 Breadcrumbs</h1>
              <p className="text-muted-foreground">Store and manage your links with ease</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </header>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <AddLinkDialog />
          </div>

          <div className="space-y-4">
            {links === undefined ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading links...</p>
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No links found matching your search." : "No links yet. Add your first link!"}
                </p>
                {!searchQuery && <AddLinkDialog />}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-1">
                {links.map((link) => (
                  <LinkCard key={link._id} link={link} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
