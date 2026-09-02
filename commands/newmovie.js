const {
    SlashCommandBuilder
} = require("discord.js");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("newmovie")
        .setDescription("Test the New Movie Drops channel"),

    async execute(interaction) {

        // Respond immediately so Discord does not timeout
        await interaction.deferReply({
            ephemeral: true
        });

        try {

            const channelId =
                process.env.NEW_MOVIE_CHANNEL_ID;

            console.log("=================================");
            console.log("🔎 CHANNEL ACCESS TEST");
            console.log("Channel ID:", channelId);
            console.log("Bot:", interaction.client.user.tag);

            console.log(
                "Guild:",
                interaction.guild?.name || "Unknown"
            );

            console.log(
                "Guild ID:",
                interaction.guild?.id || "Unknown"
            );

            console.log("=================================");


            // -----------------------------------------
            // Check .env
            // -----------------------------------------

            if (!channelId) {

                return interaction.editReply(
                    "❌ **NEW_MOVIE_CHANNEL_ID is missing.**\n\n" +
                    "Check your `.env` file."
                );

            }


            // -----------------------------------------
            // Fetch target channel
            // -----------------------------------------

            console.log("🔎 Fetching target channel...");

            const channel =
                await interaction.client.channels.fetch(
                    channelId
                );


            // -----------------------------------------
            // Channel not found
            // -----------------------------------------

            if (!channel) {

                console.log(
                    "❌ Discord returned NULL for channel."
                );

                return interaction.editReply(
                    `❌ **Channel could not be found.**\n\n` +
                    `Channel ID:\n\`${channelId}\`\n\n` +
                    `Please copy the Channel ID directly from **#new-movie-drops**.`
                );

            }


            // -----------------------------------------
            // Channel information
            // -----------------------------------------

            console.log(
                "✅ Channel fetched!"
            );

            console.log(
                "Channel name:",
                channel.name
            );

            console.log(
                "Channel ID:",
                channel.id
            );

            console.log(
                "Channel type:",
                channel.type
            );


            // -----------------------------------------
            // Permissions
            // -----------------------------------------

            const permissions =
                channel.permissionsFor(
                    interaction.client.user
                );


            const canView =
                permissions?.has("ViewChannel") ?? false;

            const canSend =
                permissions?.has("SendMessages") ?? false;

            const canEmbed =
                permissions?.has("EmbedLinks") ?? false;

            const canRead =
                permissions?.has("ReadMessageHistory") ?? false;


            console.log(
                "View Channel:",
                canView
            );

            console.log(
                "Send Messages:",
                canSend
            );

            console.log(
                "Embed Links:",
                canEmbed
            );

            console.log(
                "Read Message History:",
                canRead
            );


            // -----------------------------------------
            // Permission result
            // -----------------------------------------

            if (!canView || !canSend) {

                return interaction.editReply(
                    `❌ **Bot does not have enough permissions.**\n\n` +
                    `📢 Channel: <#${channel.id}>\n\n` +
                    `View Channel: ${canView ? "✅" : "❌"}\n` +
                    `Send Messages: ${canSend ? "✅" : "❌"}\n` +
                    `Embed Links: ${canEmbed ? "✅" : "❌"}\n` +
                    `Read Message History: ${canRead ? "✅" : "❌"}`
                );

            }


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            console.log("=================================");
            console.log("✅ CHANNEL ACCESS SUCCESSFUL");
            console.log("=================================");


            return interaction.editReply(
                `✅ **Channel access works!**\n\n` +
                `📢 Channel: <#${channel.id}>\n` +
                `🤖 Bot: ${interaction.client.user.tag}\n\n` +
                `**Permissions**\n` +
                `View Channel: ${canView ? "✅" : "❌"}\n` +
                `Send Messages: ${canSend ? "✅" : "❌"}\n` +
                `Embed Links: ${canEmbed ? "✅" : "❌"}\n` +
                `Read Message History: ${canRead ? "✅" : "❌"}\n\n` +
                `🎬 **Ready for movie drops!**`
            );

        } catch (error) {

            console.error("=================================");
            console.error("❌ CHANNEL ACCESS FAILED");
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            console.error("Full error:", error);
            console.error("=================================");


            try {

                await interaction.editReply(
                    `❌ **Bot cannot access the channel.**\n\n` +
                    `Channel ID:\n\`${process.env.NEW_MOVIE_CHANNEL_ID || "NOT SET"}\`\n\n` +
                    `Discord error:\n\`${error.code || "UNKNOWN"}\`\n\n` +
                    `${error.message || "Unknown error"}`
                );

            } catch (replyError) {

                console.error(
                    "❌ Could not send response:",
                    replyError.message
                );

            }

        }
    }
};