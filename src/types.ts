/**
 * ScrapboxからDiscordに送信するときのJSONスキーマ(未確定)
 */
export type ScrapboxWebhookRequest = {
  "text": string;
  "mrkdown": boolean;
  "username": string;
  "attachments": {
    "title": string;
    "title_link": string;
    "text": string;
    "rawText": string;
    "mrkdwn_in": string[];
    "author_name": string;
    "thumb_url"?: string;
  }[];
};

/**
 * サーバからDiscordに送信するときのJSONスキーマ(必要なものだけ定義)
 */
export type DiscordWebhookRequest = {
  // Discord Botの名前
  "username": string;
  // Discord Botのアイコン
  "avatar_url": string;
  // メッセージの概要
  "content": string;
  "embeds": {
    // Scrapboxプロジェクト名
    "title": string;
    // カラーコード(10進数)
    "color": number;
    // メッセージ本文
    "description": string;
  }[];
};

/**
 * Deno KVに格納するPageのKey
 */
export type PageKey = [
  "webhookId",
  string,
  "projectName",
  string,
  "pageName",
  string,
];

/**
 * Deno KVに格納するPageのValue
 */
export type Page = {
  projectName: string;
  name: string;
  link: string;
  authors: string[];
  updatedAt: string;
};

export type Secret = {
  name: string;
  cronSchedule: string;
  webhookId: string;
  discordWebhookURL: string;
};
