module.exports = async (monzo, { clean, url }) => {
  const { webhooks } = await monzo.webhooks();

  if (clean) {
    for (const webhook of webhooks) {
      if (webhook.url !== url) {
        await monzo.deleteWebhook(webhook.id);
        console.log(`Removed ${webhook.url}`);
      }
    }
  }

  const hook = webhooks.find(webhook => webhook.url === url);
  if (hook) return;

  console.log("Hook not found. Registering...");
  const { webhook } = await monzo.registerWebhook(url);
  console.log(`Registered ${webhook.id} for ${webhook.url}`);

  return;
};
