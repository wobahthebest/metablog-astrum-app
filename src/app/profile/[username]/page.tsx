import {
  getProfileByUsername,
  getUserPosts,
  getUsersLikedPosts,
  isFollowing,
} from "@/actions/profile.action";
import ProfilePageClient from "@/components/ProfilePageClient";
import { notFound } from "next/navigation";

export const generateMetadata = async ({
  params,
}: {
  params: { username: string };
}) => {
  const user = await getProfileByUsername(params.username);
  if (!user) return;

  return {
    title: `${user.name ?? user.userName}`,
    Description: user.bio || `Check out ${user.userName}'s profile`,
  };
};

const ProfilePageServer = async ({
  params,
}: {
  params: { username: string };
}) => {
  const user = await getProfileByUsername(params.username);

  if (!user) notFound();

  const [posts, likedPosts, following] = await Promise.all([
    getUserPosts(user.id),
    getUsersLikedPosts(user.id),
    isFollowing(user.id),
  ]);

  return (
    <ProfilePageClient
      user={user}
      posts={posts}
      likedPosts={likedPosts}
      isFollowing={following}
    />
  );
};
export default ProfilePageServer;
