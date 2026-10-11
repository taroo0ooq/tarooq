export type ContactInput = {
  name: string;
  email: string;
  topic: string;
  message: string;
  company: string;
};

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const topic = input.topic.trim();
  const message = input.message.trim();

  if (input.company.trim()) {
    errors.company = "Bot check failed.";
  }
  if (name.length < 2 || name.length > 80) {
    errors.name = "Use a name between 2 and 80 characters.";
  }
  if (!emailPattern.test(email) || email.length > 120) {
    errors.email = "Use a real email address so a reply can land.";
  }
  if (topic.length > 120) {
    errors.topic = "Keep the topic under 120 characters.";
  }
  if (message.length < 12 || message.length > 4000) {
    errors.message = "Write at least a sentence, under 4000 characters.";
  }
  return errors;
}
