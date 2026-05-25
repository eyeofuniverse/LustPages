export const EMAIL_TYPES = {
  welcome: {
    label: "Welcome Email",
    description: "Sent to new users when they create an account",
    defaultSubject: "Welcome to LustPages 🎉",
    trigger: "Account creation",
    category: "transactional" as const,
  },
  password_reset: {
    label: "Password Reset",
    description: "Magic link for users to reset their password (expires in 15 min)",
    defaultSubject: "Reset your LustPages password",
    trigger: "Forgot password request",
    category: "transactional" as const,
  },
  password_reset_success: {
    label: "Password Changed",
    description: "Confirmation sent after a successful password reset",
    defaultSubject: "Your LustPages password was changed",
    trigger: "Password reset success",
    category: "transactional" as const,
  },
  purchase_invoice: {
    label: "Purchase Invoice",
    description: "Receipt sent after a coin package purchase",
    defaultSubject: "LustPages — coins added to your account",
    trigger: "Coin purchase",
    category: "transactional" as const,
  },
  story_approved: {
    label: "Story Approved",
    description: "Notifies authors when their story is approved and published",
    defaultSubject: "Your story is now live on LustPages",
    trigger: "Admin approves a story",
    category: "notification" as const,
  },
  story_rejected: {
    label: "Story Rejected",
    description: "Notifies authors when their story is rejected, includes reason",
    defaultSubject: "Update on your story submission",
    trigger: "Admin rejects a story",
    category: "notification" as const,
  },
  new_story_notification: {
    label: "New Story Alert",
    description: "Sent to followers when an author they follow publishes a new story",
    defaultSubject: "New story from an author you follow",
    trigger: "Followed author's story approved",
    category: "notification" as const,
  },
  comment_reply: {
    label: "Comment Reply",
    description: "Notifies users when someone replies to their comment",
    defaultSubject: "Someone replied to your comment",
    trigger: "Reply posted on a comment",
    category: "notification" as const,
  },
} as const;

export type EmailType = keyof typeof EMAIL_TYPES;
export const EMAIL_TYPE_KEYS = Object.keys(EMAIL_TYPES) as EmailType[];
