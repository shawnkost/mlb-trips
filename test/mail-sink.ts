export type CapturedEmail = { to: string; subject: string; text: string };

const emails: CapturedEmail[] = [];

export function sendEmailInBackground(email: CapturedEmail) {
  emails.push(email);
}

export function sentEmails(): readonly CapturedEmail[] {
  return [...emails];
}

export function clearEmails() {
  emails.length = 0;
}

export function lastEmailTo(to: string) {
  const email = emails.findLast((e) => e.to === to);
  if (!email) throw new Error(`No email was sent to ${to}`);
  return email;
}

export function linkIn(email: CapturedEmail) {
  const match = email.text.match(/https?:\/\/\S+/);
  if (!match) throw new Error(`No link in email "${email.subject}"`);
  return new URL(match[0]);
}
