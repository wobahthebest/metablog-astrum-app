"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import toast from "react-hot-toast";

export const getProfileByUsername = async (username: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        userName: username,
      },
      select: {
        id: true,
        name: true,
        userName: true,
        bio: true,
        location: true,
        image: true,
        website: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });
    return user;
  } catch (error: any) {
    console.log("error", error.message);
  }
};

export const getUserPosts = async (userId: string) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
      },
      include: {
        Author: {
          select: {
            id: true,
            name: true,
            userName: true,
            image: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                userName: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return posts;
  } catch (error: any) {
    console.log("error", error.message);
    throw new Error("Failed to fetch user posts");
  }
};

export const getUsersLikedPosts = async (userId: string) => {
  try {
    const likedPosts = await prisma.post.findMany({
      where: {
        likes: {
          some: {
            userId,
          },
        },
      },
      include: {
        Author: {
          select: {
            id: true,
            name: true,
            userName: true,
            image: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                userName: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return likedPosts;
  } catch (error: any) {
    console.log("error", error.message);
    throw new Error("Failed to fetch user posts");
  }
};

export const updateUserProfile = async (formData: FormData) => {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorised");

    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;

    const user = await prisma.user.update({
      where: {
        clerkId,
      },
      data: {
        name,
        bio,
        location,
        website,
      },
    });

    revalidatePath("/profile");
    return { success: true, user };
  } catch (error: any) {
    console.log("error", error.message);
  }
};

export const isFollowing = async (userId: string) => {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) return false;

  try {
    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    return !!follow;
  } catch (error: any) {
    console.log("error", error.message);
  }
};
