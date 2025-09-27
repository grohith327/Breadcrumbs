"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { Plus } from "lucide-react";

export function AddLinkDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const { user } = useAuth();
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
      setOpen(false);
    } catch (error) {
      console.error("Failed to create link:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Link title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={existingTags}
              placeholder="Type to add tags..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Link</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}