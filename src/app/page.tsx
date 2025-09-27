"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { LinkCard } from "@/components/link-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { signOut } from "@/lib/auth-client";
import SignIn from "@/components/sign-in";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";

export default function Home() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isLoading } = useAuth();

  const links = useQuery(
    api.links.search,
    user ? { query: searchQuery, userId: user.id as Id<"users"> } : "skip"
  );

  const createLink = useMutation(api.links.create);
  const existingTags = useQuery(
    api.links.getAllTags,
    user ? { userId: user.id as Id<"users"> } : "skip"
  ) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !url.trim() || !user) return;

    try {
      await createLink({
        title: title.trim(),
        url: url.trim(),
        tags: tags.length > 0 ? tags : undefined,
        userId: user.id as Id<"users">,
      });

      setTitle("");
      setUrl("");
      setTags([]);
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to create link:", error);
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

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
      {/* Translucent Nav Bar */}
      <nav className="fixed top-6 left-6 right-6 z-30">
        <div className="flex items-center justify-between max-w-4xl mx-auto rounded-lg px-6 py-3 border border-gray-700/50 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <span className="text-2xl">🍞</span>
            <h1 className="text-xl font-bold text-white">Breadcrumbs</h1>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="gap-2 text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-28 pb-6 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl">Your links</h2>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full w-8 h-8 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-lg sm:text-xl">Add New Link</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Link title"
                      className="h-11 sm:h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url" className="text-sm font-medium">URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="h-11 sm:h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
                    <TagInput
                      value={tags}
                      onChange={setTags}
                      suggestions={existingTags}
                      placeholder="Type to add tags..."
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 sm:justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} className="h-11 sm:h-10">
                      Cancel
                    </Button>
                    <Button type="submit" className="h-11 sm:h-10">Add Link</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search Section */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search links and tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 sm:h-10"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800 mb-6"></div>

          {/* Links Content */}
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
              </div>
            ) : (
              <div className="grid gap-4">
                {links.map((link) => (
                  <LinkCard key={link._id} link={link} onTagClick={handleTagClick} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
