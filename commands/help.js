const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Learn how to use CineTrack"),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle("🎬 CineTrack Help")
            .setDescription(
                "Your personal movie assistant! 🍿\n\n" +
                "Here are the commands you can use:"
            )

            .addFields(

                {
                    name: "🎥 /movie",
                    value:
                        "`/movie <name>`\n" +
                        "Search for a movie or TV series and get details, rating, trailer and more."
                },

                {
                    name: "📚 /library",
                    value:
                        "`/library`\n" +
                        "Open your CineTrack library."
                },

                {
                    name: "🆕 /newmovie",
                    value:
                        "`/newmovie`\n" +
                        "See the latest movie releases detected by CineTrack."
                },

                {
                    name: "🤖 /ask",
                    value:
                        "`/ask <question>`\n" +
                        "Ask CineTrack AI about movies, recommendations and your library."
                },

                {
                    name: "❓ /help",
                    value:
                        "`/help`\n" +
                        "Show this help menu."
                },

                {
                    name: "🎬 Movie Buttons",
                    value:
                        "📌 **Bucket** → Add a movie to your personal Bucket List\n" +
                        "☑️ **Watched** → Mark a movie as watched\n" +
                        "⭐ **Rate** → Give the movie a rating from 0–10\n" +
                        "💡 **Suggest** → Suggest the movie to the community\n" +
                        "▶️ **Trailer** → Find the movie trailer on YouTube"
                },

                {
                    name: "📚 Library Sections",
                    value:
                        "📌 **Bucket List** → Movies you want to watch\n" +
                        "☑️ **Watched** → Movies you have watched\n" +
                        "⏳ **Not Watched** → Bucket movies you haven't watched\n" +
                        "💡 **Suggestions** → Movies suggested by server members\n" +
                        "⭐ **My Ratings** → Your personal ratings"
                }

            )

            .setFooter({
                text:
                    "CineTrack • Your personal movie assistant"
            });

        await interaction.reply({
            embeds: [embed]
        });
    }
};