import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { EMAIL_TYPES, type EmailType } from "@/lib/email-config";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "LustPages <hello@mail.lustpages.com>";
const SITE = process.env.SITE_URL ?? "https://lustpages.com";

// ── Base template ──────────────────────────────────────────────────────────────
function base(title: string, body: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0eff4;font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f0eff4;padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">
      <!-- Header -->
      <tr>
        <td style="background:#12111a;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#c4426a;letter-spacing:1px;">LustPages</p>
          <p style="margin:5px 0 0;font-size:11px;color:#666;letter-spacing:2.5px;text-transform:uppercase;">Premium Adult Fiction</p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="background:#1c1b28;padding:40px 40px 32px;">
          ${body}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background:#12111a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
          {{CUSTOM_NOTE}}
          <p style="margin:0;font-size:12px;color:#555;">© ${year} LustPages · All rights reserved</p>
          <p style="margin:8px 0 0;font-size:12px;color:#555;">Premium fiction platform · For adults only</p>
          <p style="margin:8px 0 0;font-size:12px;color:#444;">
            <a href="${SITE}" style="color:#c4426a;text-decoration:none;">lustpages.com</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// Shared style helpers
const h1 = `font-family:Georgia,serif;font-size:22px;font-weight:700;color:#f0eeff;margin:0 0 12px;`;
const p  = `font-size:15px;color:#b0aec8;line-height:1.7;margin:0 0 16px;`;
const muted = `font-size:13px;color:#666;line-height:1.6;margin:0;`;
const btn = `display:inline-block;background:#c4426a;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:14px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:0.3px;`;
const divider = `<tr><td style="padding:8px 0 24px;"><div style="height:1px;background:#2e2d3e;"></div></td></tr>`;
const highlight = `background:#2a2938;border-left:3px solid #c4426a;border-radius:0 8px 8px 0;padding:14px 18px;margin:16px 0 20px;`;

// ── Internal send helper ───────────────────────────────────────────────────────
async function send(to: string, defaultSubject: string, html: string, text: string, type: string) {
  try {
    const setting = await prisma.emailSetting.findUnique({ where: { type } }).catch(() => null);
    if (setting?.enabled === false) return;
    const subject = setting?.subject || defaultSubject;
    const customNote = setting?.customNote
      ? `<p style="margin:0 0 14px;font-size:12px;color:#aaa;font-style:italic;">${setting.customNote}</p>`
      : "";
    const finalHtml = html.replace("{{CUSTOM_NOTE}}", customNote);
    const finalText = setting?.customNote ? `${text}\n\n${setting.customNote}` : text;
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: finalHtml,
      text: finalText,
      headers: {
        "List-Unsubscribe": `<mailto:hello@mail.lustpages.com?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (error) console.error("[email] Resend error:", error);
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}

// ── HTML builders ──────────────────────────────────────────────────────────────

function buildWelcomeHtml(name: string): string {
  return base("Welcome to LustPages", `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td>
        <p style="${h1}">Welcome to LustPages, ${name} 👋</p>
        <p style="${p}">You've joined a community of passionate readers and talented authors. Your reading adventure starts now.</p>
        <div style="${highlight}">
          <p style="margin:0 0 8px;font-size:13px;color:#c4426a;font-weight:700;text-transform:uppercase;letter-spacing:1px;">What you can do</p>
          <p style="margin:0;font-size:14px;color:#b0aec8;line-height:1.8;">
            📖 Read thousands of free stories<br>
            🔖 Bookmark favourites &amp; track your reading<br>
            ❤️ Like and comment on stories<br>
            🪙 Unlock premium stories with coins
          </p>
        </div>
        <p style="text-align:center;margin:28px 0 0;">
          <a href="${SITE}/stories" style="${btn}">Start Reading</a>
        </p>
      </td></tr>
      ${divider}
      <tr><td><p style="${muted}">You received this because you created an account on LustPages. This is an automated message.</p></td></tr>
    </table>
  `);
}

function buildPasswordResetHtml(resetLink: string): string {
  return base("Reset your password", `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td>
        <p style="${h1}">Reset your password</p>
        <p style="${p}">We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong style="color:#f0eeff;">15 minutes</strong>.</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${resetLink}" style="${btn}">Reset Password</a>
        </p>
        <div style="${highlight}">
          <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color:#c4426a;word-break:break-all;font-size:13px;">${resetLink}</a></p>
        </div>
      </td></tr>
      ${divider}
      <tr><td><p style="${muted}">If you didn't request a password reset, you can safely ignore this email. Your password won't change.</p></td></tr>
    </table>
  `);
}

function buildPasswordResetSuccessHtml(name: string): string {
  return base("Password changed", `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td>
        <p style="${h1}">Password successfully changed</p>
        <p style="${p}">Hi ${name}, your LustPages password was just changed. You can now sign in with your new password.</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${SITE}/login" style="${btn}">Sign In</a>
        </p>
      </td></tr>
      ${divider}
      <tr><td><p style="${muted}">If you didn't make this change, please contact us immediately by replying to this email.</p></td></tr>
    </table>
  `);
}

function buildPurchaseInvoiceHtml(
  name: string,
  opts: { packageName: string; coins: number; bonusCoins: number; price: number; newBalance: number }
): string {
  const totalCoins = opts.coins + opts.bonusCoins;
  return base("Purchase receipt", `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td>
        <p style="${h1}">Purchase Confirmed 🪙</p>
        <p style="${p}">Thanks ${name}! Your coin purchase was successful.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#12111a;border-radius:12px;padding:20px 24px;margin:0 0 20px;">
          <tr>
            <td style="font-size:13px;color:#888;padding:8px 0;border-bottom:1px solid #2e2d3e;">Package</td>
            <td style="font-size:13px;color:#f0eeff;text-align:right;padding:8px 0;border-bottom:1px solid #2e2d3e;">${opts.packageName}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#888;padding:8px 0;border-bottom:1px solid #2e2d3e;">Base coins</td>
            <td style="font-size:13px;color:#f0eeff;text-align:right;padding:8px 0;border-bottom:1px solid #2e2d3e;">${opts.coins.toLocaleString()}</td>
          </tr>
          ${opts.bonusCoins > 0 ? `
          <tr>
            <td style="font-size:13px;color:#c4426a;padding:8px 0;border-bottom:1px solid #2e2d3e;">Bonus coins</td>
            <td style="font-size:13px;color:#c4426a;text-align:right;padding:8px 0;border-bottom:1px solid #2e2d3e;">+${opts.bonusCoins.toLocaleString()}</td>
          </tr>` : ""}
          <tr>
            <td style="font-size:15px;font-weight:700;color:#f0eeff;padding:12px 0 4px;">Total coins added</td>
            <td style="font-size:15px;font-weight:700;color:#c4426a;text-align:right;padding:12px 0 4px;">${totalCoins.toLocaleString()} 🪙</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#888;padding:4px 0;">Amount charged</td>
            <td style="font-size:13px;color:#888;text-align:right;padding:4px 0;">$${opts.price.toFixed(2)} USD</td>
          </tr>
        </table>
        <div style="${highlight}">
          <p style="margin:0;font-size:13px;color:#888;">Your new coin balance: <strong style="color:#f0eeff;">${opts.newBalance.toLocaleString()} coins</strong></p>
        </div>
        <p style="text-align:center;margin:24px 0 0;">
          <a href="${SITE}/premium/stories" style="${btn}">Browse Premium Stories</a>
        </p>
      </td></tr>
      ${divider}
      <tr><td><p style="${muted}">Keep this email as your receipt. Questions? Reply to this email.</p></td></tr>
    </table>
  `);
}

function buildStoryApprovedHtml(authorName: string, storyTitle: string, storySlug: string): string {
  const storyUrl = `${SITE}/stories/${storySlug}`;
  return base("Story approved", `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td>
        <p style="${h1}">Your story is live! 🎉</p>
        <p style="${p}">Congratulations ${authorName}! Your story has been reviewed and approved by our team. It's now live and visible to all readers.</p>
        <div style="${highlight}">
          <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Published Story</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#f0eeff;">${storyTitle}</p>
        </div>
        <p style="text-align:center;margin:28px 0 0;">
          <a href="${storyUrl}" style="${btn}">View Your Story</a>
        </p>
      </td></tr>
      ${divider}
      <tr><td><p style="${muted}">Share your story link with friends and grow your readership! Every view helps your story rise in the rankings.</p></td></tr>
    </table>
  `);
}

function buildStoryRejectedHtml(authorName: string, storyTitle: string, reason: string): string {
  return base("Story not approved", `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td>
        <p style="${h1}">Story review update</p>
        <p style="${p}">Hi ${authorName}, after reviewing your submission, we were unable to approve it at this time.</p>
        <div style="${highlight}">
          <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Story</p>
          <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#f0eeff;">${storyTitle}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#c4426a;text-transform:uppercase;letter-spacing:1px;">Reason</p>
          <p style="margin:0;font-size:14px;color:#b0aec8;">${reason}</p>
        </div>
        <p style="${p}">You can edit your story in your author dashboard and resubmit it after making the necessary changes.</p>
        <p style="text-align:center;margin:24px 0 0;">
          <a href="${SITE}/author-dashboard" style="${btn}">Go to Dashboard</a>
        </p>
      </td></tr>
      ${divider}
      <tr><td><p style="${muted}">If you believe this decision was made in error, you can reply to this email for clarification.</p></td></tr>
    </table>
  `);
}

function buildNewStoryNotificationHtml(
  readerName: string,
  authorName: string,
  storyTitle: string,
  storySlug: string,
  excerpt: string
): string {
  const storyUrl = `${SITE}/stories/${storySlug}`;
  const shortExcerpt = excerpt.length > 160 ? excerpt.slice(0, 157) + "…" : excerpt;
  return base("New story alert", `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td>
        <p style="${h1}">New story from ${authorName}</p>
        <p style="${p}">Hi ${readerName}! An author you follow just published a new story.</p>
        <div style="${highlight}">
          <p style="margin:0 0 4px;font-size:12px;color:#c4426a;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${authorName}</p>
          <p style="margin:0 0 10px;font-size:17px;font-weight:700;color:#f0eeff;">${storyTitle}</p>
          <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">${shortExcerpt}</p>
        </div>
        <p style="text-align:center;margin:28px 0 0;">
          <a href="${storyUrl}" style="${btn}">Read Now</a>
        </p>
      </td></tr>
      ${divider}
      <tr><td><p style="${muted}">You're receiving this because you follow ${authorName} on LustPages. <a href="${SITE}/authors" style="color:#c4426a;text-decoration:none;">Manage follows</a></p></td></tr>
    </table>
  `);
}

function buildCommentReplyHtml(
  readerName: string,
  replierName: string,
  storyTitle: string,
  storySlug: string,
  replySnippet: string
): string {
  const storyUrl = `${SITE}/stories/${storySlug}#comments`;
  const shortReply = replySnippet.length > 120 ? replySnippet.slice(0, 117) + "…" : replySnippet;
  return base("Someone replied to your comment", `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td>
        <p style="${h1}">New reply on your comment</p>
        <p style="${p}">Hi ${readerName}! <strong style="color:#f0eeff;">${replierName}</strong> replied to your comment on <em style="color:#f0eeff;">${storyTitle}</em>.</p>
        <div style="${highlight}">
          <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">${replierName} said</p>
          <p style="margin:0;font-size:14px;color:#b0aec8;line-height:1.6;">"${shortReply}"</p>
        </div>
        <p style="text-align:center;margin:28px 0 0;">
          <a href="${storyUrl}" style="${btn}">View Reply</a>
        </p>
      </td></tr>
      ${divider}
      <tr><td><p style="${muted}">You're receiving this because you commented on a story on LustPages.</p></td></tr>
    </table>
  `);
}

// ── Plain-text builders ────────────────────────────────────────────────────────
const FOOTER_TEXT = `© ${new Date().getFullYear()} LustPages · Premium fiction platform · For adults only\n${SITE}`;

function buildWelcomeText(name: string): string {
  return `Welcome to LustPages, ${name}!\n\nYou've joined a community of passionate readers and talented authors. Your reading adventure starts now.\n\nWhat you can do:\n- Read thousands of free stories\n- Bookmark favourites & track your reading\n- Like and comment on stories\n- Unlock premium stories with coins\n\nStart reading: ${SITE}/stories\n\n---\nYou received this because you created an account on LustPages.\n${FOOTER_TEXT}`;
}

function buildPasswordResetText(resetLink: string): string {
  return `Reset your LustPages password\n\nWe received a request to reset your password. Click the link below to choose a new one. This link expires in 15 minutes.\n\n${resetLink}\n\n---\nIf you didn't request a password reset, ignore this email. Your password won't change.\n${FOOTER_TEXT}`;
}

function buildPasswordResetSuccessText(name: string): string {
  return `Password successfully changed\n\nHi ${name}, your LustPages password was just changed. You can now sign in with your new password.\n\nSign in: ${SITE}/login\n\n---\nIf you didn't make this change, please reply to this email immediately.\n${FOOTER_TEXT}`;
}

function buildPurchaseInvoiceText(
  name: string,
  opts: { packageName: string; coins: number; bonusCoins: number; price: number; newBalance: number }
): string {
  const totalCoins = opts.coins + opts.bonusCoins;
  const bonus = opts.bonusCoins > 0 ? `\nBonus coins: +${opts.bonusCoins.toLocaleString()}` : "";
  return `Purchase Confirmed!\n\nThanks ${name}! Your coin purchase was successful.\n\nPackage: ${opts.packageName}\nBase coins: ${opts.coins.toLocaleString()}${bonus}\nTotal coins added: ${totalCoins.toLocaleString()}\nAmount charged: $${opts.price.toFixed(2)} USD\nNew balance: ${opts.newBalance.toLocaleString()} coins\n\nBrowse premium stories: ${SITE}/premium/stories\n\n---\nKeep this email as your receipt. Questions? Reply to this email.\n${FOOTER_TEXT}`;
}

function buildStoryApprovedText(authorName: string, storyTitle: string, storySlug: string): string {
  return `Your story is live!\n\nCongratulations ${authorName}! Your story "${storyTitle}" has been reviewed and approved. It's now live and visible to all readers.\n\nView your story: ${SITE}/stories/${storySlug}\n\n---\nShare your story link to grow your readership!\n${FOOTER_TEXT}`;
}

function buildStoryRejectedText(authorName: string, storyTitle: string, reason: string): string {
  return `Story review update\n\nHi ${authorName}, after reviewing "${storyTitle}", we were unable to approve it at this time.\n\nReason: ${reason}\n\nYou can edit your story in your author dashboard and resubmit it.\n\nDashboard: ${SITE}/author-dashboard\n\n---\nIf you believe this decision was made in error, reply to this email.\n${FOOTER_TEXT}`;
}

function buildNewStoryNotificationText(
  readerName: string,
  authorName: string,
  storyTitle: string,
  storySlug: string,
  excerpt: string
): string {
  const shortExcerpt = excerpt.length > 160 ? excerpt.slice(0, 157) + "…" : excerpt;
  return `New story from ${authorName}\n\nHi ${readerName}! ${authorName} just published a new story.\n\n"${storyTitle}"\n\n${shortExcerpt}\n\nRead now: ${SITE}/stories/${storySlug}\n\n---\nYou're receiving this because you follow ${authorName} on LustPages.\nManage follows: ${SITE}/authors\n${FOOTER_TEXT}`;
}

function buildCommentReplyText(
  readerName: string,
  replierName: string,
  storyTitle: string,
  storySlug: string,
  replySnippet: string
): string {
  const shortReply = replySnippet.length > 120 ? replySnippet.slice(0, 117) + "…" : replySnippet;
  return `New reply on your comment\n\nHi ${readerName}! ${replierName} replied to your comment on "${storyTitle}".\n\n"${shortReply}"\n\nView reply: ${SITE}/stories/${storySlug}#comments\n\n---\nYou're receiving this because you commented on a story on LustPages.\n${FOOTER_TEXT}`;
}

// ── Admin: preview HTML with sample data ───────────────────────────────────────
export function buildEmailPreviewHtml(type: string): string {
  const PREVIEW_SITE = SITE;
  const html = (() => {
    switch (type as EmailType) {
      case "welcome":
        return buildWelcomeHtml("Alex Reader");
      case "password_reset":
        return buildPasswordResetHtml(`${PREVIEW_SITE}/reset-password?token=sample-preview-token`);
      case "password_reset_success":
        return buildPasswordResetSuccessHtml("Alex Reader");
      case "purchase_invoice":
        return buildPurchaseInvoiceHtml("Alex Reader", {
          packageName: "Gold Package",
          coins: 1000,
          bonusCoins: 200,
          price: 9.99,
          newBalance: 1200,
        });
      case "story_approved":
        return buildStoryApprovedHtml("Jane Author", "The Midnight Garden", "the-midnight-garden");
      case "story_rejected":
        return buildStoryRejectedHtml(
          "Jane Author",
          "The Midnight Garden",
          "Please revise the content to comply with our community guidelines regarding explicit language in story descriptions."
        );
      case "new_story_notification":
        return buildNewStoryNotificationHtml(
          "Alex Reader",
          "Jane Author",
          "The Midnight Garden",
          "the-midnight-garden",
          "A captivating tale of forbidden romance set in a mysterious garden where reality blurs with fantasy and every shadow hides a secret..."
        );
      case "comment_reply":
        return buildCommentReplyHtml(
          "Alex Reader",
          "Jane Author",
          "The Midnight Garden",
          "the-midnight-garden",
          "Thank you so much for the kind words! I worked really hard on that chapter."
        );
      default:
        return base("Preview unavailable", `<p style="color:#888;text-align:center;">No preview for this template.</p>`);
    }
  })();
  return html.replace("{{CUSTOM_NOTE}}", "");
}

// ── Admin: send test email bypassing enabled check ─────────────────────────────
export async function sendTestEmail(to: string, type: string) {
  const config = EMAIL_TYPES[type as EmailType];
  if (!config) throw new Error(`Unknown email type: ${type}`);
  const html = buildEmailPreviewHtml(type).replace(
    "{{CUSTOM_NOTE}}",
    `<p style="margin:0 0 14px;font-size:11px;color:#888;background:#1a1929;padding:6px 10px;border-radius:4px;display:inline-block;">🧪 This is a test email sent from the admin panel</p>`
  );
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `[TEST] ${config.defaultSubject}`,
    html,
    text: `[TEST] ${config.defaultSubject}\n\nThis is a test email sent from the LustPages admin panel.\n\n${SITE}`,
    headers: {
      "List-Unsubscribe": `<mailto:hello@mail.lustpages.com?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  if (error) throw new Error(error.message);
}

// ── Public send functions ──────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  await send(to, "Welcome to LustPages 🎉", buildWelcomeHtml(name), buildWelcomeText(name), "welcome");
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  await send(to, "Reset your LustPages password", buildPasswordResetHtml(resetLink), buildPasswordResetText(resetLink), "password_reset");
}

export async function sendPasswordResetSuccessEmail(to: string, name: string) {
  await send(to, "Your LustPages password was changed", buildPasswordResetSuccessHtml(name), buildPasswordResetSuccessText(name), "password_reset_success");
}

export async function sendPurchaseInvoiceEmail(
  to: string,
  name: string,
  opts: { packageName: string; coins: number; bonusCoins: number; price: number; newBalance: number }
) {
  const totalCoins = opts.coins + opts.bonusCoins;
  await send(
    to,
    `LustPages — ${totalCoins.toLocaleString()} coins added to your account`,
    buildPurchaseInvoiceHtml(name, opts),
    buildPurchaseInvoiceText(name, opts),
    "purchase_invoice"
  );
}

export async function sendStoryApprovedEmail(
  to: string,
  authorName: string,
  storyTitle: string,
  storySlug: string
) {
  await send(
    to,
    `Your story "${storyTitle}" is now live on LustPages`,
    buildStoryApprovedHtml(authorName, storyTitle, storySlug),
    buildStoryApprovedText(authorName, storyTitle, storySlug),
    "story_approved"
  );
}

export async function sendStoryRejectedEmail(
  to: string,
  authorName: string,
  storyTitle: string,
  reason: string
) {
  await send(
    to,
    `Update on your story "${storyTitle}"`,
    buildStoryRejectedHtml(authorName, storyTitle, reason),
    buildStoryRejectedText(authorName, storyTitle, reason),
    "story_rejected"
  );
}

export async function sendNewStoryNotification(
  to: string,
  readerName: string,
  authorName: string,
  storyTitle: string,
  storySlug: string,
  excerpt: string
) {
  await send(
    to,
    `${authorName} just published "${storyTitle}"`,
    buildNewStoryNotificationHtml(readerName, authorName, storyTitle, storySlug, excerpt),
    buildNewStoryNotificationText(readerName, authorName, storyTitle, storySlug, excerpt),
    "new_story_notification"
  );
}

export async function sendCommentReplyEmail(
  to: string,
  readerName: string,
  replierName: string,
  storyTitle: string,
  storySlug: string,
  replySnippet: string
) {
  await send(
    to,
    `${replierName} replied to your comment on LustPages`,
    buildCommentReplyHtml(readerName, replierName, storyTitle, storySlug, replySnippet),
    buildCommentReplyText(readerName, replierName, storyTitle, storySlug, replySnippet),
    "comment_reply"
  );
}
