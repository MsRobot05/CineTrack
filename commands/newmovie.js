const { SlashCommandBuilder } = require("discord.js");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("newmovie")
        .setDescription("Test the New Movie Drops channel"),

    async execute(interaction) {

        await interaction.deferReply();

        const channelId =
            process.env.NEW_MOVIE_CHANNEL_ID;

        console.log("=================================");
        console.log("🔎 CHANNEL ACCESS TEST");
        console.log("Channel ID:", channelId);
        console.log("Bot:", interaction.client.user.tag);
        console.log("Guild:", interaction.guild.name);
        console.log("Guild ID:", interaction.guild.id);
        console.log("=================================");

        try {

            const channel =
                await interaction.client.channels.fetch(
                    channelId
                );

            console.log(
                "✅ Channel fetched:",
                channel.name
            );

            console.log(
                "Channel type:",
                channel.type
            );

            // Check permissions
            const permissions =
                channel.permissionsFor(
                    interaction.client.user
                );

            console.log(
                "View Channel:",
                permissions?.has("ViewChannel")
            );

            console.log(
                "Send Messages:",
                permissions?.has("SendMessages")
            );

            console.log(
                "Embed Links:",
                permissions?.has("EmbedLinks")
            );

            await interaction.editReply(
                `✅ **Channel access works!**\n\n` +
                `📢 Channel: <#${channel.id}>\n` +
                `🤖 Bot: ${interaction.client.user.tag}\n\n` +
                `You can now use this channel for movie drops.`
            );

        } catch (error) {

            console.error(
                "❌ CHANNEL ACCESS FAILED"
            );

            console.error(
                "Error code:",
                error.code
            );

            console.error(
                "Error message:",
                error.message
            );

            await interaction.editReply(
                `❌ **Bot cannot access the channel.**\n\n` +
                `Channel ID:\n\`${channelId}\`\n\n` +
                `Discord error: \`${error.code}\``
            );
        }
    }
};