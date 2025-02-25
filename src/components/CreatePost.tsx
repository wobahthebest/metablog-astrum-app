"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { ImageIcon, Loader2Icon, SendIcon } from "lucide-react";
import { createPost } from "@/actions/post.action";
import toast from "react-hot-toast";
import ImageUploud from "./ImageUploud";

const CreatePost = () => {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUploud, setShowImageUploud] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) return;

    setIsPosting(true);
    try {
      const result = await createPost(content, imageUrl);
      if (result?.success) {
        setContent("");
        setImageUrl("");
        setShowImageUploud(false);

        toast.success("Post created successfully");
      }
    } catch (error: any) {
      console.log("error", error.message);
      toast.error("failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-x-4 flex">
            <Avatar className="w-10 h-10">
              <AvatarImage src={`${user?.imageUrl || "/avatar.png"}`} />
            </Avatar>
            <Textarea
              placeholder="What's on your mind today"
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPosting}
            />
          </div>
        </div>

        {(showImageUploud || imageUrl) && (
          <div className="border rounded-lg p-4">
            <ImageUploud
              endpoint="postImage"
              value={imageUrl}
              onChange={(url) => {
                setImageUrl(url);
                if (!url) setShowImageUploud(false);
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              onClick={() => setShowImageUploud(!showImageUploud)}
              disabled={isPosting}
            >
              <ImageIcon className="size-4 mr-2" />
              Photo
            </Button>
          </div>
          <Button
            className="flex items-center"
            onClick={handleSubmit}
            disabled={(!content.trim() && !imageUrl) || isPosting}
          >
            {isPosting ? (
              <>
                <Loader2Icon className="size-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <SendIcon className="size-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
export default CreatePost;
