const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const axios = require("axios");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("movie")
        .setDescription("Search for a movie or TV series")
        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("Enter the movie or series name")
                .setRequired(true)
        ),

    async execute(interaction) {

        const movieName =
            interaction.options.getString("name");

        await interaction.deferReply();

        try {

            const response = await axios.get(
                "https://www.omdbapi.com/",
                {
                    params: {
                        apikey: process.env.OMDB_API_KEY,
                        t: movieName,
                        plot: "full"
                    }
                }
            );

            const movie = response.data;

            console.log("OMDb Response:", movie);

            if (movie.Response === "False") {

                return interaction.editReply(
                    `❌ I couldn't find **${movieName}**.`
                );
            }

            const trailerSearch =
                encodeURIComponent(
                    `${movie.Title} ${movie.Year} official trailer`
                );

            const trailerURL =
                `https://www.youtube.com/results?search_query=${trailerSearch}`;

            const embed = new EmbedBuilder()
                .setTitle(
                    `🎬 ${movie.Title} (${movie.Year})`
                )
                .setDescription(
                    movie.Plot ||
                    "No description available."
                )
                .addFields(

                    {
                        name: "⭐ IMDb Rating",
                        value:
                            movie.imdbRating || "N/A",
                        inline: true
                    },

                    {
                        name: "🎭 Genre",
                        value:
                            movie.Genre || "N/A",
                        inline: true
                    },

                    {
                        name: "⏱️ Runtime",
                        value:
                            movie.Runtime || "N/A",
                        inline: true
                    },

                    {
                        name: "🎬 Director",
                        value:
                            movie.Director || "N/A",
                        inline: true
                    },

                    {
                        name: "👥 Cast",
                        value:
                            movie.Actors || "N/A",
                        inline: false
                    }

                )
                .setFooter({
                    text:
                        "CineTrack • Movie information powered by OMDb"
                });

            if (
                movie.Poster &&
                movie.Poster !== "N/A"
            ) {

                embed.setThumbnail(movie.Poster);

            }

            const buttons =
                new ActionRowBuilder().addComponents(

                    new ButtonBuilder()
                        .setCustomId(
                            `watched_${movie.imdbID}`
                        )
                        .setLabel("Watched")
                        .setEmoji("☑️")
                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `watchlist_${movie.imdbID}`
                        )
                        .setLabel("Bucket")
                        .setEmoji("📌")
                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `rate_${movie.imdbID}`
                        )
                        .setLabel("Rate")
                        .setEmoji("⭐")
                        .setStyle(
                            ButtonStyle.Secondary
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `suggest_${movie.imdbID}`
                        )
                        .setLabel("Suggest")
                        .setEmoji("💡")
                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()
                        .setLabel("Trailer")
                        .setEmoji("▶️")
                        .setStyle(
                            ButtonStyle.Link
                        )
                        .setURL(trailerURL)

                );

            await interaction.editReply({

                embeds: [embed],

                components: [buttons]

            });

        } catch (error) {

            console.error(
                "Movie search error:",
                error.response?.data ||
                error.message
            );

            await interaction.editReply(
                "❌ Movie search failed. Check the VS Code terminal."
            );
        }
    }
};