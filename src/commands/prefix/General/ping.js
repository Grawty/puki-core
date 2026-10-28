module.exports = {
  structure: { name: "ping", aliases: ["p"] },
  options: { cooldown: 3 },
  run: async (client, message) => {
    await message.reply({ content: `Pong! ${client.ws.ping}ms`, allowedMentions: { repliedUser: false } });
  },
};
