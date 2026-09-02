const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const db = require("../database");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("library")
        .setDescription("View your CineTrack movie library"),

    async execute(interaction) {

        await interaction.deferReply();

        try {

            const [movies] = await db.query(
                `
                SELECT DISTINCT
                    m.id,
                    m.title,
                    m.year,
                    m.poster,
                    m.imdb_rating,

                    CASE
                        WHEN w.id IS NOT NULL THEN 1
                        ELSE 0
                    END AS watched,

                    CASE
                        WHEN b.id IS NOT NULL THEN 1
                        ELSE 0
                    END AS bucket

                FROM movies m

                LEFT JOIN watched w
                    ON w.movie_id = m.id
                    AND w.user_id = ?

                LEFT JOIN bucket_list b
                    ON b.movie_id = m.id
                    AND b.user_id = ?

                WHERE w.id IS NOT NULL
                   OR b.id IS NOT NULL

                ORDER BY m.title ASC
                `,
                [
                    interaction.user.id,
                    interaction.user.id
                ]
            );

            if (movies.length === 0) {

                return interaction.editReply(
                    "📚 **Your CineTrack Library is empty.**\n\nUse `/movie` and add movies to your Bucket List."
                );
            }

            const description = movies
                .map((movie, index) => {

                    let status = "";

                    if (movie.watched) {
                        status = "☑️ Watched";
                    } else if (movie.bucket) {
                        status = "⏳ Not Watched";
                    }

                    return (
                        `**${index + 1}. 🎬 ${movie.title}** (${movie.year})\n` +
                        `${status} • ⭐ ${movie.imdb_rating || "N/A"}`
                    );

                })
                .join("\n\n");

            const embed = new EmbedBuilder()
                .setTitle("📚 My CineTrack Library")
                .setDescription(description)
                .setFooter({
                    text: `CineTrack • ${movies.length} movie(s)`
                });

            const buttons = new ActionRowBuilder().addComponents(

                new ButtonBuilder()
                    .setCustomId("library_bucket")
                    .setLabel("Bucket List")
                    .setEmoji("📌")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("library_watched")
                    .setLabel("Watched")
                    .setEmoji("☑️")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId("library_unwatched")
                    .setLabel("To Watch")
                    .setEmoji("⏳")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("library_suggestions")
                    .setLabel("Suggestions")
                    .setEmoji("💡")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("library_ratings")
                    .setLabel("Ratings")
                    .setEmoji("⭐")
                    .setStyle(ButtonStyle.Secondary)

            );

            await interaction.editReply({
                embeds: [embed],
                components: [buttons]
            });

        } catch (error) {

            console.error("Library error:", error);

            await interaction.editReply(
                "❌ Couldn't load your library."
            );
        }
    }
};