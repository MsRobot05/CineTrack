const { SlashCommandBuilder } = require("discord.js");
const { askCineAgent } = require("../ai/cineAgent");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ask")
        .setDescription("Ask CineTrack AI about movies")
        .addStringOption(option =>
            option
                .setName("question")
                .setDescription("Ask CineTrack AI something")
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const question =
                interaction.options.getString("question");

            console.log("🤖 CineTrack AI:");
            console.log("User:", interaction.user.username);
            console.log("Question:", question);

            const answer =
                await askCineAgent(question);

            await interaction.editReply({
                content: answer
            });

        } catch (error) {
            console.error("❌ CineTrack AI error:", error);

            await interaction.editReply(
                "❌ CineTrack AI could not process your request."
            );
        }
    }
};