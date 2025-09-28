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
import { Edit, Trash2, ExternalLink, Bot } from "lucide-react";

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
  onAIClick?: (url: string, title: string) => void;
}

export function LinkCard({ link, onTagClick, selectedTags = [], onAIClick }: LinkCardProps) {
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
    <Card className="group hover:shadow-md transition-shadow h-fit">
      <CardHeader className="pb-3 p-4 sm:p-6">
        <div className="space-y-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg leading-tight overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >{link.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 truncate text-sm"
              >
                {link.url}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </CardDescription>
          </div>
          <div className="flex gap-2 opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAIClick?.(link.url, link.title)}
              title="Generate AI summary of this page"
              className="h-8 w-8 p-0"
            >
              <Bot className="w-4 h-4 text-blue-500" />
            </Button>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Edit Link</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title" className="text-sm font-medium">Title *</Label>
                    <Input
                      id="edit-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 sm:h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-url" className="text-sm font-medium">URL *</Label>
                    <Input
                      id="edit-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="h-11 sm:h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tags" className="text-sm font-medium">Tags</Label>
                    <TagInput
                      value={tags}
                      onChange={setTags}
                      suggestions={existingTags}
                      placeholder="Type to add tags..."
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 sm:justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="h-11 sm:h-10">
                      Cancel
                    </Button>
                    <Button type="submit" className="h-11 sm:h-10">Update Link</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="h-8 w-8 p-0">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {link.tags && link.tags.length > 0 && (
        <CardContent className="pt-0 p-4 sm:px-6 sm:pb-6">
          <div className="flex flex-wrap gap-1.5 sm:gap-1">
            {link.tags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? "default" : "secondary"}
                  className={`text-sm sm:text-xs cursor-pointer transition-colors h-7 sm:h-auto px-2.5 sm:px-2 ${
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