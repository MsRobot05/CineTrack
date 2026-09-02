const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("newmovie")
        .setDescription("Test the New Movie Drops channel"),

    async execute(interaction) {

        try {

            await interaction.reply({
                content: "🔎 Testing CineTrack...",
                ephemeral: true
            });

            console.log("=================================");
            console.log("🔎 NEWMOVIE COMMAND RECEIVED");
            console.log("Bot:", interaction.client.user.tag);
            console.log("Guild ID:", interaction.guildId);
            console.log(
                "Guild Name:",
                interaction.guild?.name || "NO GUILD"
            );
            console.log(
                "Channel ID:",
                interaction.channelId
            );
            console.log(
                "Channel Name:",
                interaction.channel?.name || "NO CHANNEL NAME"
            );
            console.log(
                "Channel Type:",
                interaction.channel?.type
            );
            console.log("=================================");

        } catch (error) {

            console.error("❌ NEWMOVIE ERROR:", error);

        }
    }
};