module.exports = {
  structure: { name: "say", aliases: ["echo"] },
  options: { cooldown: 3 },
  // args are the words after the command name
  run: async (client, message, args) => {
    if (!args.length) return message.reply("Say what?");
    await message.reply({ content: args.join(" "), allowedMentions: { parse: [], repliedUser: false } });
  },
};
