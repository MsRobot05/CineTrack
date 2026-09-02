const axios = require("axios");
const cron = require("node-cron");

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const db = require("./database");


// =====================================================
// INDIA DATE
// =====================================================

function getIndiaDate() {

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}


// =====================================================
// GET MOVIES FROM IMDb
// =====================================================

async function getNewMovies() {

    const today = getIndiaDate();

    console.log(
        `📅 Checking movie releases for ${today}...`
    );

    try {

        const response = await axios.get(
            "https://www.imdb.com/calendar/?region=IN&type=MOVIE",
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/139 Safari/537.36",

                    "Accept":
                        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                    "Accept-Language":
                        "en-US,en;q=0.9"
                },

                timeout: 15000
            }
        );


        const html = response.data;

        console.log(
            `📦 IMDb page received: ${html.length} characters`
        );


        const movies = [];

        // ---------------------------------------------
        // Extract IMDb movie IDs + titles from HTML
        // ---------------------------------------------

        const regex =
            /\/title\/(tt\d+)[^>]*>[\s\S]{0,500}?(?:<h3[^>]*>|<span[^>]*class="ipc-title__text[^"]*"[^>]*>)([^<]+)/gi;


        let match;

        while (
            (match = regex.exec(html)) !== null
        ) {

            const imdbId = match[1];

            let title = match[2]
                .replace(/&amp;/g, "&")
                .replace(/&#x27;/g, "'")
                .replace(/&quot;/g, '"')
                .trim();


            if (
                title &&
                title.length > 1 &&
                !movies.some(
                    movie =>
                        movie.imdbId === imdbId
                )
            ) {

                movies.push({
                    imdbId,
                    title
                });
            }
        }


        // ---------------------------------------------
        // Alternative extraction
        // ---------------------------------------------

        if (movies.length === 0) {

            const idRegex =
                /\/title\/(tt\d+)/g;

            const foundIds = [];

            while (
                (match = idRegex.exec(html)) !== null
            ) {

                if (
                    !foundIds.includes(match[1])
                ) {

                    foundIds.push(match[1]);
                }
            }


            console.log(
                `🔎 Found ${foundIds.length} IMDb IDs`
            );


            for (
                const imdbId of foundIds.slice(0, 20)
            ) {

                try {

                    const movie =
                        await getMovieByIMDbId(
                            imdbId
                        );


                    if (
                        movie &&
                        movie.Type === "movie"
                    ) {

                        movies.push({
                            imdbId,
                            title: movie.Title
                        });
                    }

                } catch (error) {

                    console.error(
                        `⚠️ Could not load ${imdbId}`
                    );
                }
            }
        }


        console.log(
            `🎬 Found ${movies.length} movie(s).`
        );


        return movies;

    } catch (error) {

        console.error(
            "❌ IMDb calendar error:",
            error.message
        );

        return [];
    }
}


// =====================================================
// GET MOVIE BY IMDb ID
// =====================================================

async function getMovieByIMDbId(imdbId) {

    try {

        const response =
            await axios.get(
                "https://www.omdbapi.com/",
                {
                    params: {
                        apikey:
                            process.env.OMDB_API_KEY,

                        i: imdbId,

                        plot: "full",

                        type: "movie"
                    },

                    timeout: 10000
                }
            );


        if (
            response.data.Response === "False"
        ) {

            return null;
        }


        return response.data;

    } catch (error) {

        console.error(
            `❌ OMDb error ${imdbId}:`,
            error.message
        );

        return null;
    }
}


// =====================================================
// GET MOVIE FROM OMDb BY TITLE
// =====================================================

async function getMovieFromOMDb(title) {

    try {

        const response =
            await axios.get(
                "https://www.omdbapi.com/",
                {
                    params: {

                        apikey:
                            process.env.OMDB_API_KEY,

                        t: title,

                        plot: "full",

                        type: "movie"
                    },

                    timeout: 10000
                }
            );


        if (
            response.data.Response === "False"
        ) {

            console.log(
                `⚠️ OMDb couldn't find: ${title}`
            );

            return null;
        }


        return response.data;

    } catch (error) {

        console.error(
            `❌ OMDb error for ${title}:`,
            error.message
        );

        return null;
    }
}


// =====================================================
// YOUTUBE TRAILER
// =====================================================

function getYouTubeTrailer(title, year) {

    const query =
        `${title} ${year} official trailer`;

    return (
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(query)
    );
}


// =====================================================
// CHECK DUPLICATE
// =====================================================

async function alreadyPosted(
    title,
    year
) {

    try {

        const [rows] =
            await db.query(
                `
                SELECT id
                FROM movie_drops
                WHERE title = ?
                AND release_date >= ?
                AND release_date < ?
                LIMIT 1
                `,
                [
                    title,
                    `${year}-01-01`,
                    `${year + 1}-01-01`
                ]
            );


        return rows.length > 0;

    } catch (error) {

        console.error(
            "❌ Duplicate check error:",
            error.message
        );

        return false;
    }
}


// =====================================================
// SAVE MOVIE DROP
// =====================================================

async function saveMovieDrop(
    title,
    releaseDate
) {

    try {

        await db.query(
            `
            INSERT INTO movie_drops
            (
                title,
                release_date
            )
            VALUES (?, ?)
            `,
            [
                title,
                releaseDate
            ]
        );


        console.log(
            `💾 Saved movie drop: ${title}`
        );

    } catch (error) {

        console.error(
            "❌ Database save error:",
            error.message
        );
    }
}


// =====================================================
// SEND MOVIE DROP
// =====================================================

async function sendMovieDrop(
    client,
    movie
) {

    try {

        const channelId =
            process.env.NEW_MOVIE_CHANNEL_ID;


        if (!channelId) {

            console.error(
                "❌ NEW_MOVIE_CHANNEL_ID is missing."
            );

            return false;
        }


        const channel =
            await client.channels.fetch(
                channelId
            );


        if (!channel) {

            console.error(
                "❌ New movie channel not found."
            );

            return false;
        }


        console.log(
            `📢 Target channel: #${channel.name}`
        );


        // ---------------------------------------------
        // Get OMDb information
        // ---------------------------------------------

        let details;


        if (movie.imdbId) {

            details =
                await getMovieByIMDbId(
                    movie.imdbId
                );

        } else {

            details =
                await getMovieFromOMDb(
                    movie.title
                );
        }


        if (!details) {

            console.log(
                `⚠️ Skipping ${movie.title}`
            );

            return false;
        }


        const year =
            parseInt(details.Year) ||
            new Date().getFullYear();


        // ---------------------------------------------
        // Duplicate check
        // ---------------------------------------------

        const exists =
            await alreadyPosted(
                details.Title,
                year
            );


        if (exists) {

            console.log(
                `⏭️ Already announced: ${details.Title}`
            );

            return false;
        }


        // ---------------------------------------------
        // Trailer
        // ---------------------------------------------

        const trailerURL =
            getYouTubeTrailer(
                details.Title,
                year
            );


        // ---------------------------------------------
        // Embed
        // ---------------------------------------------

        const embed =
            new EmbedBuilder()

                .setTitle(
                    "🆕 NEW MOVIE DROP"
                )

                .setDescription(
                    `🎬 **${details.Title}**\n\n` +
                    (
                        details.Plot ||
                        "No description available."
                    )
                )

                .addFields(

                    {
                        name: "📅 Year",
                        value:
                            details.Year ||
                            "N/A",
                        inline: true
                    },

                    {
                        name: "⭐ IMDb Rating",
                        value:
                            details.imdbRating ||
                            "N/A",
                        inline: true
                    },

                    {
                        name: "🎭 Genre",
                        value:
                            details.Genre ||
                            "N/A",
                        inline: true
                    },

                    {
                        name: "⏱️ Runtime",
                        value:
                            details.Runtime ||
                            "N/A",
                        inline: true
                    }

                )

                .setFooter({
                    text:
                        "CineTrack • Automatic Daily Movie Drop"
                });


        // ---------------------------------------------
        // Poster
        // ---------------------------------------------

        if (
            details.Poster &&
            details.Poster !== "N/A"
        ) {

            embed.setImage(
                details.Poster
            );
        }


        // ---------------------------------------------
        // Trailer Button
        // ---------------------------------------------

        const buttons =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()

                        .setLabel(
                            "Watch Trailer"
                        )

                        .setEmoji("▶️")

                        .setStyle(
                            ButtonStyle.Link
                        )

                        .setURL(
                            trailerURL
                        )

                );


        // ---------------------------------------------
        // Send to Discord
        // ---------------------------------------------

        await channel.send({

            content:
                `🆕 **NEW MOVIE DROP!**\n` +
                `🎬 **${details.Title}**`,

            embeds: [
                embed
            ],

            components: [
                buttons
            ]

        });


        // ---------------------------------------------
        // Save correctly
        // ---------------------------------------------

        const releaseDate =
            `${year}-01-01`;


        await saveMovieDrop(
            details.Title,
            releaseDate
        );


        console.log(
            `✅ New movie posted: ${details.Title}`
        );


        return true;

    } catch (error) {

        console.error(
            `❌ Failed to post ${movie.title}:`,
            error.message
        );

        return false;
    }
}


// =====================================================
// CHECK NEW MOVIES
// =====================================================

async function checkNewMovies(client) {

    console.log(
        "================================="
    );

    console.log(
        "🔎 Starting automatic movie check..."
    );


    const movies =
        await getNewMovies();


    if (
        !movies ||
        movies.length === 0
    ) {

        console.log(
            "⚠️ No movies found from IMDb."
        );


        return {
            count: 0
        };
    }


    // Maximum 5 announcements
    const moviesToProcess =
        movies.slice(0, 5);


    let postedCount = 0;


    for (
        const movie
        of moviesToProcess
    ) {

        const posted =
            await sendMovieDrop(
                client,
                movie
            );


        if (posted) {

            postedCount++;
        }


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    1500
                )
        );
    }


    console.log(
        `✅ Check finished. ${postedCount} movie(s) posted.`
    );


    return {
        count: postedCount
    };
}


// =====================================================
// START AUTOMATIC SYSTEM
// =====================================================

function startNewMovieDrops(client) {

    console.log(
        "🆕 Automatic New Movie Drop system started."
    );


    // -------------------------------------------------
    // TEST IMMEDIATELY
    // -------------------------------------------------

    checkNewMovies(client)
        .catch(error => {

            console.error(
                "❌ Initial movie check failed:",
                error
            );

        });


    // -------------------------------------------------
    // DAILY AT 9:00 AM INDIA TIME
    // -------------------------------------------------

    cron.schedule(
        "0 9 * * *",

        () => {

            console.log(
                "⏰ Daily movie drop check started."
            );


            checkNewMovies(client)
                .catch(error => {

                    console.error(
                        "❌ Daily movie check failed:",
                        error
                    );

                });

        },

        {
            timezone:
                "Asia/Kolkata"
        }
    );
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    startNewMovieDrops,

    checkNewMovies

};