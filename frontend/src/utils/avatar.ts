import { env } from "../config/env";

/**
 * Normalizes avatar URLs to handle both local paths and absolute URLs (like Google OAuth avatars)
 */
export const getAvatarUrl = (avatar: string | null | undefined): string | null => {
    if (!avatar || avatar.length <= 1) return null;

    // If it's already an absolute URL, return it as is
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        return avatar;
    }

    // Otherwise, prepend the base URL for local storage paths
    return `${env.BASE_URL}${avatar}`;
};
