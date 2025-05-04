import secrets from "./secrets.json" with { type: "json" };
import { DiscordWebhookRequest, Page, Secret } from "./types.ts";

export function execCron() {
  // secretsのバリデーションしたい
  for (const secret of secrets) {
    if (secret.cronSchedule === "") return;
    postToDiscordServer(secret);
  }
}

function postToDiscordServer(secret: Secret) {
  // Deno KVにたまっているページ情報をDiscordに送信
  Deno.cron(`Send to ${secret.name}`, secret.cronSchedule, async () => {
    console.log(`### [START] Send to ${secret.name} ###`);
    const kv = await Deno.openKv();

    const entries = kv.list<Page>({ prefix: ["webhookId", secret.webhookId] });
    const pageKeys = [];
    const groupByProjectName = new Map<string, string[]>();
    for await (const entry of entries) {
      const page = entry.value;
      const { projectName } = page;

      if (!groupByProjectName.has(projectName)) {
        groupByProjectName.set(projectName, []);
      }
      const sentence =
        `- **[${page.name}](${page.link})**\rupdated at ${page.updatedAt} by ${page.authors}\r\r`;
      groupByProjectName.get(projectName)?.push(sentence);

      pageKeys.push(entry.key);
    }

    if (pageKeys.length === 0) {
      console.log("メッセージを送信しませんでした。");
      return;
    }

    const message: DiscordWebhookRequest = {
      username: "scrapbox-stream-notify",
      avatar_url: "https://i.gyazo.com/7057219f5b20ca8afd122945b72453d3.png",
      content: "ページが更新されました。",
      embeds: [],
    };
    groupByProjectName.forEach((sentences, projectName) => {
      // Discordサーバにメッセージを送信
      // Project単位でembedを作成したい
      const embed = {
        title: projectName,
        color: 1697305,
        description: sentences.join(""),
      };
      message.embeds.push(embed);
    });

    const result = await fetch(secret.discordWebhookURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    console.log(`fetch status code: ${result.status}`);
    if (!result.ok) {
      throw new Error("failed to fetch");
    }
    console.log(`send message to Discord`);
    console.log(message);

    // 投稿後、ページを削除する
    for await (const key of pageKeys) {
      kv.delete(key);
      console.log(`${key} is deleted.`);
    }
  });
}
