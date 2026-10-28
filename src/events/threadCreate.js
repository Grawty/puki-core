module.exports = {
  event: "threadCreate",
  // Discord only sends events from threads the bot has joined, so join new ones to keep hearing them
  run: async (_client, thread) => {
    if (thread.joinable && !thread.joined) await thread.join();
  },
};
