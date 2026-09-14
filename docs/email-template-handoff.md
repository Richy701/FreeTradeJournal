# Resend email template handoff

The current local email design and copy have been approved by the user. Update matching Resend templates with this version, preserving live personalization and automation wiring. This handoff does not authorize sending emails or deploying application code.

## Source and preview

- Source: `functions/src/emails/` (TypeScript React Email components).
- Shared layout and spacing: `components.tsx`.
- Prices, feature limits and public URLs: `facts.ts`.
- Local visual gallery: `/tmp/ftj-email-designs/index.html`.
- Render fresh HTML from source. The gallery HTML contains preview values and embedded images and must not be uploaded.
- Preserve the white/charcoal design, sans-serif headings, amber buttons and official product images. The weekly recap has a 16px empty-state heading-to-body gap and consistent content/stat gutters.
- Latest subject copy is in `functions/src/index.ts`; subjects are not part of rendered template HTML.

## Hosted mappings documented in source

| Resend alias | Local component |
| --- | --- |
| `activation-import` | `ActivationImportEmail.tsx` |
| `activation-proof` | `ActivationProofEmail.tsx` |
| `activation-ai-grade` | `ActivationAiGradeEmail.tsx` |

These mappings come from source comments. Confirm each against the live Resend template and automation before updating. Live inventory was blocked by an invalid-key error on the available Resend connection; it has not been verified in this session.

Inspect the live inventory for any additional matching templates. Do not invent aliases or create duplicate templates just because a local component exists.

## Emails rendered by application code

`functions/src/index.ts` renders the welcome, Pro confirmation, cancellation, checkout recovery, password reset, email verification, day 3/7/14/21 reminders, weekly digest, and legacy trial lifecycle emails to HTML before sending. Updating hosted Resend templates alone does not change those send paths. Report the separate Firebase deployment requirement; do not deploy as part of this handoff.

Other components are used by campaign scripts or internal reporting. Their presence is not authorization to publish a campaign. Leave internal/admin messages for the next task.

## Update procedure

1. Read AGENTS.md. Inspect and save the existing hosted definitions before editing.
2. Match the source component to the live alias/ID and inspect its automation usage.
3. Preserve IDs, aliases, sender/reply-to settings, variables, fallbacks and unsubscribe behavior. Inspect the actual live syntax; do not guess personalization tags.
4. Render with distinct temporary markers for dynamic props, then map them to the existing Resend variables. Never publish preview names, dates, static unsubscribe tokens or authentication links. Optional unsubscribe props must receive the correct live variable when applicable.
5. Keep official public image URLs from the source, not local file paths or base64 preview images.
6. Review subject and preview text as well as HTML. If a subject is configured in the automation, inspect it separately and change only outdated copy belonging to the matched email.
7. Preview desktop/mobile, long and missing names, variable substitution, links, image loading and unsubscribe behavior. Compare against the local design.
8. Publish the verified matching template changes and retrieve them again to confirm the published content/status.

Do not send test emails, broadcasts or automation events. Do not alter recipients, enrollment, schedules or triggers. Do not publish retired trial offers or archived lifetime/birthday campaigns. Do not commit, push or deploy application changes without a separate instruction.

## Verification and reporting

The local pass checked 51 browser renders at 320, 375 and 640px with no horizontal overflow or primary buttons below 44px. Screenshots were inspected. These are browser checks, not proof of Gmail/Outlook client rendering. Receipt and non-empty report variants need their dynamic data checked during provider verification.

If repository code changes, run the functions build and the required root `npm run build`. Do not modify or discard unrelated pending work.

Report a table of template, local source, published status and verification result, plus anything requiring a separate deployment. Resend updates remain pending until confirmed through the provider.
