const FRUITS = [
  "Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Fig", "Grape", "Kiwi", "Lemon", "Mango",
  "Melon", "Orange", "Peach", "Pear", "Pineapple", "Plum", "Raspberry", "Strawberry",
];

module.exports = {
  // matched by the name of the command the option belongs to
  commandName: "options",
  run: async (client, interaction) => {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== "fruit") return;

    const typed = focused.value.toLowerCase();
    const matches = FRUITS.filter((fruit) => fruit.toLowerCase().includes(typed)).slice(0, 25); // Discord shows 25 at most
    await interaction.respond(matches.map((fruit) => ({ name: fruit, value: fruit.toLowerCase() })));
  },
};
