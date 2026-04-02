import * as React from "react";
import { render } from "@react-email/components";
import { WelcomeEmail } from "./src/emails/WelcomeEmail";
import { ProUpgradeEmail } from "./src/emails/ProUpgradeEmail";
import { CancellationEmail } from "./src/emails/CancellationEmail";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const emails = [
    {
      name: "welcome",
      html: await render(React.createElement(WelcomeEmail, { firstName: "Richy" })),
    },
    {
      name: "pro-upgrade",
      html: await render(React.createElement(ProUpgradeEmail, { firstName: "Richy", planLabel: "Pro (Monthly)" })),
    },
    {
      name: "cancellation",
      html: await render(React.createElement(CancellationEmail, { firstName: "Richy", endDate: "30 April 2026" })),
    },
  ];

  for (const email of emails) {
    const out = path.join(__dirname, `${email.name}-preview.html`);
    fs.writeFileSync(out, email.html);
    console.log(`Written: ${out}`);
  }
}

main().catch(console.error);
