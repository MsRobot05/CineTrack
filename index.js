require("dotenv").config();
const askCommand = require("./commands/ask");
const db = require("./database");
const newMovieCommand = require("./commands/newmovie");
const {
    startNewMovieDrops
} = require("./newMovieDrops");


const {
    Client,
    GatewayIntentBits,
    Collection,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const axios = require("axios");

const movieCommand = require("./commands/movie");
const libraryCommand = require("./commands/library");


// ==========================================
// CLIENT
// ==========================================

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});


// ==========================================
// COMMANDS
// ==========================================

client.commands = new Collection();

client.commands.set(
    movieCommand.data.name,
    movieCommand
);
client.commands.set(
    newMovieCommand.data.name,
    newMovieCommand
);

client.commands.set(
    libraryCommand.data.name,
    libraryCommand
);
client.commands.set(
    newMovieCommand.data.name,
    newMovieCommand
);
client.commands.set(
    askCommand.data.name,
    askCommand
);
client.showLibraryHome = showLibraryHome;

// ==========================================
// BOT READY
// ==========================================

client.once("clientReady", async () => {

    console.log(`🎬 ${client.user.tag} is online!`);

    try {

        await db.query("SELECT 1");

        console.log("✅ MySQL connected!");
 // Start automatic movie drops
        startNewMovieDrops(client);

    } catch (error) {

        console.error(
            "❌ MySQL connection failed:",
            error.message
        );

    }
    

});


// ==========================================
// INTERACTIONS
// ==========================================

client.on("interactionCreate", async (interaction) => {


    // ==========================================
    // SLASH COMMANDS
    // ==========================================

    if (interaction.isChatInputCommand()) {

        const command =
            client.commands.get(interaction.commandName);

        if (!command) return;

        try {

            await command.execute(interaction);

        } catch (error) {

            console.error("Command error:", error);

            if (
                interaction.replied ||
                interaction.deferred
            ) {

                await interaction.followUp({
                    content: "❌ Something went wrong.",
                    ephemeral: true
                });

            } else {

                await interaction.reply({
                    content: "❌ Something went wrong.",
                    ephemeral: true
                });

            }

        }

        return;
    }


    // ==========================================
    // BUTTONS
    // ==========================================

    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    console.log("🔘 Button clicked:", customId);


    // ==========================================
    // WATCHED
    // ==========================================

    if (customId.startsWith("watched_")) {

        const imdbId =
            customId.replace("watched_", "");

        try {

            await interaction.deferReply();

            const movieId =
                await getOrCreateMovie(imdbId);

            await db.query(
                `
                INSERT IGNORE INTO watched
                (
                    user_id,
                    username,
                    movie_id
                )
                VALUES (?, ?, ?)
                `,
                [
                    interaction.user.id,
                    interaction.user.username,
                    movieId
                ]
            );

            const [rows] = await db.query(
                `
                SELECT title
                FROM movies
                WHERE id = ?
                `,
                [movieId]
            );

            const title =
                rows[0]?.title || "this movie";

            await interaction.editReply(
                `☑️ **${interaction.user.username}** marked **${title}** as **Watched**!`
            );

        } catch (error) {

            console.error("Watched error:", error);

            await interaction.editReply(
                "❌ Couldn't save watched status."
            );

        }

        return;
    }


    // ==========================================
    // BUCKET LIST
    // ==========================================

    if (customId.startsWith("watchlist_")) {

        const imdbId =
            customId.replace("watchlist_", "");

        try {

            await interaction.deferReply();

            const movieId =
                await getOrCreateMovie(imdbId);

            await db.query(
                `
                INSERT IGNORE INTO bucket_list
                (
                    user_id,
                    username,
                    movie_id
                )
                VALUES (?, ?, ?)
                `,
                [
                    interaction.user.id,
                    interaction.user.username,
                    movieId
                ]
            );

            const [rows] = await db.query(
                `
                SELECT title
                FROM movies
                WHERE id = ?
                `,
                [movieId]
            );

            const title =
                rows[0]?.title || "this movie";

            await interaction.editReply(
                `📌 **${interaction.user.username}** added **${title}** to the **Bucket List**!`
            );

        } catch (error) {

            console.error("Bucket error:", error);

            await interaction.editReply(
                "❌ Couldn't add the movie to your Bucket List."
            );

        }

        return;
    }


    // ==========================================
    // SUGGEST
    // ==========================================

    if (customId.startsWith("suggest_")) {

        const imdbId =
            customId.replace("suggest_", "");

        try {

            await interaction.deferReply();

            const movieId =
                await getOrCreateMovie(imdbId);

            await db.query(
                `
                INSERT INTO suggestions
                (
                    user_id,
                    username,
                    movie_id
                )
                VALUES (?, ?, ?)
                `,
                [
                    interaction.user.id,
                    interaction.user.username,
                    movieId
                ]
            );

            const [rows] = await db.query(
                `
                SELECT title
                FROM movies
                WHERE id = ?
                `,
                [movieId]
            );

            const title =
                rows[0]?.title || "this movie";

            await interaction.editReply(
                `💡 **${interaction.user.username}** suggested **${title}**!\n\n👤 Suggested by: **${interaction.user.username}**`
            );

        } catch (error) {

            console.error("Suggestion error:", error);

            await interaction.editReply(
                "❌ Couldn't save the suggestion."
            );

        }

        return;
    }


    // ==========================================
    // RATE BUTTON
    // ==========================================

    if (customId.startsWith("rate_")) {

        const imdbId =
            customId.replace("rate_", "");

        const modal =
            new ModalBuilder()
                .setCustomId(`ratingModal_${imdbId}`)
                .setTitle("Rate this movie");


        const ratingInput =
            new TextInputBuilder()
                .setCustomId("rating")
                .setLabel("Your rating (0 - 10)")
                .setPlaceholder("Example: 8.5")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(3);


        const row =
            new ActionRowBuilder()
                .addComponents(ratingInput);


        modal.addComponents(row);

        await interaction.showModal(modal);

        return;
    }


    // ==========================================
    // LIBRARY BUTTONS
    // ==========================================

    if (customId === "library_bucket") {

        await showBucketList(interaction);

        return;
    }


    if (customId === "library_watched") {

        await showWatchedList(interaction);

        return;
    }


    if (customId === "library_unwatched") {

        await showNotWatchedList(interaction);

        return;
    }


    if (customId === "library_suggestions") {

        await showSuggestions(interaction);

        return;
    }


    if (customId === "library_ratings") {

        await showRatings(interaction);

        return;
    }


    if (customId === "library_back") {

        await showLibraryHome(interaction);

        return;
    }

});


// ==========================================
// RATING MODAL
// ==========================================

client.on("interactionCreate", async (interaction) => {

    if (!interaction.isModalSubmit()) return;

    if (
        !interaction.customId.startsWith("ratingModal_")
    ) {
        return;
    }


    const imdbId =
        interaction.customId.replace(
            "ratingModal_",
            ""
        );


    const ratingText =
        interaction.fields.getTextInputValue("rating");

    const rating =
        Number(ratingText);


    if (
        Number.isNaN(rating) ||
        rating < 0 ||
        rating > 10
    ) {

        return interaction.reply({
            content:
                "❌ Rating must be between **0 and 10**.",
            ephemeral: true
        });

    }


    try {

        await interaction.deferReply();


        const movieId =
            await getOrCreateMovie(imdbId);


        // Check if user already rated this movie

        const [existing] = await db.query(
            `
            SELECT id
            FROM ratings
            WHERE user_id = ?
            AND movie_id = ?
            `,
            [
                interaction.user.id,
                movieId
            ]
        );


        if (existing.length > 0) {

            await db.query(
                `
                UPDATE ratings
                SET rating = ?,
                    username = ?,
                    rated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                AND movie_id = ?
                `,
                [
                    rating,
                    interaction.user.username,
                    interaction.user.id,
                    movieId
                ]
            );

        } else {

            await db.query(
                `
                INSERT INTO ratings
                (
                    user_id,
                    username,
                    movie_id,
                    rating
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    interaction.user.id,
                    interaction.user.username,
                    movieId,
                    rating
                ]
            );

        }


        const [rows] = await db.query(
            `
            SELECT title
            FROM movies
            WHERE id = ?
            `,
            [movieId]
        );


        const title =
            rows[0]?.title || "the movie";


        await interaction.editReply(
            `⭐ **${interaction.user.username}** rated **${title}** **${rating}/10**!`
        );


    } catch (error) {

        console.error("Rating error:", error);

        await interaction.editReply(
            "❌ Couldn't save your rating."
        );

    }

});


// ==========================================
// LIBRARY HOME
// ==========================================

async function showLibraryHome(interaction) {

    const embed =
        new EmbedBuilder()
            .setTitle("🎬 CineTrack Library")
            .setDescription(
                "Choose what you want to see:"
            )
            .addFields(
                {
                    name: "📌 Bucket List",
                    value: "Movies you want to watch.",
                    inline: true
                },
                {
                    name: "☑️ Watched",
                    value: "Movies you have watched.",
                    inline: true
                },
                {
                    name: "⏳ Not Watched",
                    value: "Bucket movies still waiting.",
                    inline: true
                },
                {
                    name: "💡 Suggestions",
                    value: "Movies suggested by users.",
                    inline: true
                },
                {
                    name: "⭐ My Ratings",
                    value: "Movies you have rated.",
                    inline: true
                }
            )
            .setFooter({
                text: "CineTrack • Your personal movie library"
            });


    const row1 =
        new ActionRowBuilder()
            .addComponents(

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
                    .setLabel("Not Watched")
                    .setEmoji("⏳")
                    .setStyle(ButtonStyle.Secondary)

            );


    const row2 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId("library_suggestions")
                    .setLabel("Suggestions")
                    .setEmoji("💡")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("library_ratings")
                    .setLabel("My Ratings")
                    .setEmoji("⭐")
                    .setStyle(ButtonStyle.Secondary)

            );


    if (interaction.deferred || interaction.replied) {

        await interaction.editReply({
            embeds: [embed],
            components: [row1, row2]
        });

    } else {

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2]
        });

    }

}


// ==========================================
// BUCKET LIST
// ==========================================

async function showBucketList(interaction) {

    try {

        await interaction.deferReply();


        const [movies] =
            await db.query(
                `
                SELECT
                    m.title,
                    m.year,
                    m.poster,
                    m.imdb_rating
                FROM bucket_list b
                JOIN movies m
                    ON b.movie_id = m.id
                WHERE b.user_id = ?
                ORDER BY b.added_at DESC
                `,
                [interaction.user.id]
            );


        if (movies.length === 0) {

            return interaction.editReply(
                "📌 **Your Bucket List is empty.**"
            );

        }


        const description =
            movies
                .map((movie, index) => {

                    return (
                        `**${index + 1}. ${movie.title}** (${movie.year})\n` +
                        `⭐ IMDb: ${movie.imdb_rating || "N/A"}`
                    );

                })
                .join("\n\n");


        const embed =
            new EmbedBuilder()
                .setTitle("📌 My Bucket List")
                .setDescription(description)
                .setFooter({
                    text:
                        `CineTrack • ${movies.length} movie(s)`
                });


        await interaction.editReply({
            embeds: [embed],
            components: [libraryBackButton()]
        });


    } catch (error) {

        console.error(
            "Bucket list error:",
            error
        );

        await interaction.editReply(
            "❌ Couldn't load your Bucket List."
        );

    }

}


// ==========================================
// WATCHED LIST
// ==========================================

async function showWatchedList(interaction) {

    try {

        await interaction.deferReply();


        const [movies] =
            await db.query(
                `
                SELECT
                    m.title,
                    m.year,
                    m.poster,
                    m.imdb_rating,
                    w.watched_at
                FROM watched w
                JOIN movies m
                    ON w.movie_id = m.id
                WHERE w.user_id = ?
                ORDER BY w.watched_at DESC
                `,
                [interaction.user.id]
            );


        if (movies.length === 0) {

            return interaction.editReply(
                "☑️ **You haven't watched any movies yet.**"
            );

        }


        const description =
            movies
                .map((movie, index) => {

                    return (
                        `**${index + 1}. ${movie.title}** (${movie.year})\n` +
                        `☑️ Watched\n` +
                        `⭐ IMDb: ${movie.imdb_rating || "N/A"}`
                    );

                })
                .join("\n\n");


        const embed =
            new EmbedBuilder()
                .setTitle("☑️ Movies I Watched")
                .setDescription(description)
                .setFooter({
                    text:
                        `CineTrack • ${movies.length} watched`
                });


        await interaction.editReply({
            embeds: [embed],
            components: [libraryBackButton()]
        });


    } catch (error) {

        console.error(
            "Watched list error:",
            error
        );

        await interaction.editReply(
            "❌ Couldn't load watched movies."
        );

    }

}


// ==========================================
// NOT WATCHED
// ==========================================

async function showNotWatchedList(interaction) {

    try {

        await interaction.deferReply();


        const [movies] =
            await db.query(
                `
                SELECT
                    m.title,
                    m.year,
                    m.poster,
                    m.imdb_rating
                FROM bucket_list b
                JOIN movies m
                    ON b.movie_id = m.id
                LEFT JOIN watched w
                    ON w.movie_id = m.id
                    AND w.user_id = b.user_id
                WHERE b.user_id = ?
                AND w.id IS NULL
                ORDER BY b.added_at DESC
                `,
                [interaction.user.id]
            );


        if (movies.length === 0) {

            return interaction.editReply(
                "🎉 **You have no unwatched movies in your Bucket List!**"
            );

        }


        const description =
            movies
                .map((movie, index) => {

                    return (
                        `**${index + 1}. ${movie.title}** (${movie.year})\n` +
                        `⏳ Not watched yet\n` +
                        `⭐ IMDb: ${movie.imdb_rating || "N/A"}`
                    );

                })
                .join("\n\n");


        const embed =
            new EmbedBuilder()
                .setTitle("⏳ Still To Watch")
                .setDescription(description)
                .setFooter({
                    text:
                        `CineTrack • ${movies.length} remaining`
                });


        await interaction.editReply({
            embeds: [embed],
            components: [libraryBackButton()]
        });


    } catch (error) {

        console.error(
            "Not watched error:",
            error
        );

        await interaction.editReply(
            "❌ Couldn't load unwatched movies."
        );

    }

}


// ==========================================
// SUGGESTIONS
// ==========================================

async function showSuggestions(interaction) {

    try {

        await interaction.deferReply();


        const [movies] =
            await db.query(
                `
                SELECT
                    m.title,
                    m.year,
                    m.poster,
                    m.imdb_rating,
                    s.username,
                    s.suggested_at
                FROM suggestions s
                JOIN movies m
                    ON s.movie_id = m.id
                ORDER BY s.suggested_at DESC
                `
            );


        if (movies.length === 0) {

            return interaction.editReply(
                "💡 **No movie suggestions yet.**"
            );

        }


        const description =
            movies
                .map((movie, index) => {

                    return (
                        `**${index + 1}. ${movie.title}** (${movie.year})\n` +
                        `👤 Suggested by: **${movie.username}**\n` +
                        `⭐ IMDb: ${movie.imdb_rating || "N/A"}`
                    );

                })
                .join("\n\n");


        const embed =
            new EmbedBuilder()
                .setTitle("💡 Movie Suggestions")
                .setDescription(description)
                .setFooter({
                    text:
                        `CineTrack • ${movies.length} suggestion(s)`
                });


        await interaction.editReply({
            embeds: [embed],
            components: [libraryBackButton()]
        });


    } catch (error) {

        console.error(
            "Suggestions error:",
            error
        );

        await interaction.editReply(
            "❌ Couldn't load suggestions."
        );

    }

}


// ==========================================
// RATINGS
// ==========================================

async function showRatings(interaction) {

    try {

        await interaction.deferReply();


        const [movies] =
            await db.query(
                `
                SELECT
                    m.title,
                    m.year,
                    m.poster,
                    r.rating
                FROM ratings r
                JOIN movies m
                    ON r.movie_id = m.id
                WHERE r.user_id = ?
                ORDER BY r.rated_at DESC
                `,
                [interaction.user.id]
            );


        if (movies.length === 0) {

            return interaction.editReply(
                "⭐ **You haven't rated any movies yet.**"
            );

        }


        const description =
            movies
                .map((movie, index) => {

                    return (
                        `**${index + 1}. ${movie.title}** (${movie.year})\n` +
                        `⭐ Your Rating: **${movie.rating}/10**`
                    );

                })
                .join("\n\n");


        const embed =
            new EmbedBuilder()
                .setTitle("⭐ My Movie Ratings")
                .setDescription(description)
                .setFooter({
                    text:
                        `CineTrack • ${movies.length} rating(s)`
                });


        await interaction.editReply({
            embeds: [embed],
            components: [libraryBackButton()]
        });


    } catch (error) {

        console.error(
            "Ratings error:",
            error
        );

        await interaction.editReply(
            "❌ Couldn't load your ratings."
        );

    }

}


// ==========================================
// BACK BUTTON
// ==========================================

function libraryBackButton() {

    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId("library_back")
                .setLabel("Back to Library")
                .setEmoji("🔙")
                .setStyle(ButtonStyle.Secondary)

        );

}


// ==========================================
// GET / CREATE MOVIE
// ==========================================

async function getOrCreateMovie(imdbId) {

    const [existing] =
        await db.query(
            `
            SELECT id
            FROM movies
            WHERE imdb_id = ?
            `,
            [imdbId]
        );


    if (existing.length > 0) {

        return existing[0].id;

    }


    const response =
        await axios.get(
            "https://www.omdbapi.com/",
            {
                params: {
                    apikey:
                        process.env.OMDB_API_KEY,
                    i: imdbId,
                    plot: "full"
                }
            }
        );


    const movie =
        response.data;


    if (
        movie.Response === "False"
    ) {

        throw new Error(
            "Movie not found in OMDb"
        );

    }


    await db.query(
        `
        INSERT INTO movies
        (
            imdb_id,
            title,
            year,
            poster,
            genre,
            plot,
            imdb_rating,
            type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            movie.imdbID,
            movie.Title,
            movie.Year,
            movie.Poster,
            movie.Genre,
            movie.Plot,
            movie.imdbRating,
            movie.Type
        ]
    );


    const [rows] =
        await db.query(
            `
            SELECT id
            FROM movies
            WHERE imdb_id = ?
            `,
            [imdbId]
        );


    return rows[0].id;

}


// ==========================================
// LOGIN
// ==========================================

client.login(
    process.env.DISCORD_TOKEN
);