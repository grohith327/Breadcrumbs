"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { Edit, Trash2, ExternalLink } from "lucide-react";

interface LinkCardProps {
  link: {
    _id: Id<"links">;
    title: string;
    url: string;
    tags?: string[];
    userId?: Id<"users">;
    createdAt: number;
  };
  onTagClick?: (tag: string) => void;
  selectedTags?: string[];
}

export function LinkCard({ link, onTagClick, selectedTags = [] }: LinkCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [tags, setTags] = useState<string[]>(link.tags || []);

  const { user } = useAuth();
  const updateLink = useMutation(api.links.update);
  const deleteLink = useMutation(api.links.remove);
  const existingTags = useQuery(
    api.links.getAllTags,
    user ? { userId: user.id as Id<"users"> } : "skip"
  ) ?? [];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !url.trim() || !user) return;

    try {
      await updateLink({
        id: link._id,
        title: title.trim(),
        url: url.trim(),
        tags: tags.length > 0 ? tags : undefined,
        userId: user.id as Id<"users">,
      });
      setEditOpen(false);
    } catch (error) {
      console.error("Failed to update link:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this link?") && user) {
      try {
        await deleteLink({ id: link._id, userId: user.id as Id<"users"> });
      } catch (error) {
        console.error("Failed to delete link:", error);
      }
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{link.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 truncate"
              >
                {link.url}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </CardDescription>
          </div>
          <div className="flex gap-1 opacity-100">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Link</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title *</Label>
                    <Input
                      id="edit-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-url">URL *</Label>
                    <Input
                      id="edit-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tags">Tags</Label>
                    <TagInput
                      value={tags}
                      onChange={setTags}
                      suggestions={existingTags}
                      placeholder="Type to add tags..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Link</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {link.tags && link.tags.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1">
            {link.tags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? "default" : "secondary"}
                  className={`text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-secondary/80"
                  }`}
                  onClick={() => onTagClick?.(tag)}
                >
                  {tag}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}