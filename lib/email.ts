import { waitUntil } from "@vercel/functions";
import { Resend } from "resend";

const from = "MLB Trips <onboarding@resend.dev>";

let resend: Resend | undefined;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return (resend ??= new Resend(apiKey));
}

type Email = { to: string; subject: string; text: string };

async function send(email: Email) {
  const { error } = await getResend().emails.send({ from, ...email });
  if (error) throw error;
}

export function sendEmailInBackground(email: Email) {
  waitUntil(
    send(email).catch((error) => {
      console.error("failed to send email", error);
    }),
  );
}
