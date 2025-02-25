"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const syncUser = async () => {
  const { userId } = await auth();
  const User = await currentUser();
  try {
    if (!userId || !User) return;

    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    if (existingUser) return existingUser;

    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${User.lastName || ""} ${User.firstName || ""}`,
        userName:
          User.username ?? User.emailAddresses[0].emailAddress.split("@")[0],
        email: User.emailAddresses[0].emailAddress,
        image: User.imageUrl,
      },
    });

    return dbUser;
  } catch (error: any) {
    console.log("error", error.message);
  }
};

export const getUserByClerkId = async (clerkId: string) => {
  return prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
};

export const getDbUserID = async () => {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await getUserByClerkId(clerkId);

  if (!user) return;

  return user.id;
};

export const getRandomUsers = async () => {
  try {
    const userId = await getDbUserID();

    if (!userId) return [];

    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: { followerId: userId },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        userName: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 4,
    });
    return randomUsers;
  } catch (error: any) {
    console.log("error", error.message);
    return [];
  }
};

export const toggleFollow = async (targetUserId: string) => {
  try {
    const userId = await getDbUserID();

    if (!userId) return;

    if (userId === targetUserId)
      throw new Error("you can not follow yourselve");

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId,
            creatorId: userId,
          },
        }),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.log("error", error.message);
    return { success: false };
  }
};
