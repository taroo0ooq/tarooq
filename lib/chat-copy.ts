import type { Locale } from "./locale";

export type ChatCopy = {
  launcher: string;
  title: string;
  hint: string;
  empty: string;
  placeholder: string;
  send: string;
  sending: string;
  close: string;
  talk: string;
  offTopic: string;
  injection: string;
  invention: string;
  length: string;
  tooLong: string;
  guard: string;
  error: string;
  rate: string;
  unavailable: string;
  invalid: string;
  tooLarge: string;
  forbidden: string;
  turnstile: string;
};

const english: ChatCopy = {
  launcher: "Ask about this site",
  title: "Ask about this site",
  hint: "Answers come only from the published pages and posts.",
  empty: "Ask about the work published here.",
  placeholder: "Ask about Tareq's work",
  send: "Send",
  sending: "Sending",
  close: "Close chat",
  talk: "Talk to Tareq",
  offTopic: "I can only answer from what this site publishes. Use Talk to Tareq for anything else.",
  injection: "I can only answer from the published pages and posts. I can't follow a request to change that. Use Talk to Tareq for anything else.",
  invention: "That isn't on this site, so I won't guess at a figure, a client, a price, or availability. Use Talk to Tareq to ask him directly.",
  length: "This conversation has reached its limit. Use Talk to Tareq to continue.",
  tooLong: "That message is too long. Ask it in a shorter note, or use Talk to Tareq.",
  guard: "I don't have that on the site, so I won't guess. Use Talk to Tareq.",
  error: "The guide can't answer right now. Use Talk to Tareq.",
  rate: "Too many questions from this network. Try again shortly, or use Talk to Tareq.",
  unavailable: "The guide isn't available right now. Use Talk to Tareq.",
  invalid: "Send a short question about the site.",
  tooLarge: "That request is too large.",
  forbidden: "The guide only answers questions sent from this site.",
  turnstile: "The check didn't go through. Try again.",
};

const arabic: ChatCopy = {
  launcher: "اسأل عن هذا الموقع",
  title: "اسأل عن هذا الموقع",
  hint: "الإجابات من الصفحات والمقالات المنشورة فقط.",
  empty: "اسأل عما هو منشور هنا.",
  placeholder: "اسأل عن عمل طارق",
  send: "إرسال",
  sending: "جارٍ الإرسال",
  close: "إغلاق المحادثة",
  talk: "تحدث مع طارق",
  offTopic: "أجيب فقط مما ينشره هذا الموقع. لأي شيء آخر، استخدم «تحدث مع طارق».",
  injection: "أجيب فقط من الصفحات والمقالات المنشورة، ولا أستطيع اتباع طلب يغيّر ذلك. لأي شيء آخر، استخدم «تحدث مع طارق».",
  invention: "هذا ليس على الموقع، لذا لن أخمّن رقمًا أو عميلًا أو سعرًا أو مدى التفرغ. استخدم «تحدث مع طارق» لتسأله مباشرة.",
  length: "بلغت هذه المحادثة حدها. للمتابعة استخدم «تحدث مع طارق».",
  tooLong: "هذه الرسالة طويلة. اختصرها، أو استخدم «تحدث مع طارق».",
  guard: "هذا ليس على الموقع، لذا لن أخمّن. استخدم «تحدث مع طارق».",
  error: "لا يستطيع الدليل الإجابة الآن. استخدم «تحدث مع طارق».",
  rate: "كثرت الأسئلة من هذه الشبكة. أعد المحاولة بعد قليل، أو استخدم «تحدث مع طارق».",
  unavailable: "الدليل غير متاح الآن. استخدم «تحدث مع طارق».",
  invalid: "أرسل سؤالًا قصيرًا عن الموقع.",
  tooLarge: "هذا الطلب أكبر من اللازم.",
  forbidden: "يجيب الدليل فقط عن الأسئلة المرسَلة من هذا الموقع.",
  turnstile: "لم ينجح التحقق. أعد المحاولة.",
};

export function chatCopy(locale: Locale): ChatCopy {
  return locale === "ar" ? arabic : english;
}
