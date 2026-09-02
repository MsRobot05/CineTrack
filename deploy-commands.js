


require("dotenv").config();


const { REST, Routes } = require("discord.js");

const movieCommand = require("./commands/movie");
const libraryCommand = require("./commands/library");
const newMovieCommand = require("./commands/newmovie");

const commands = [
    movieCommand.data.toJSON(),
    libraryCommand.data.toJSON(),

     newMovieCommand.data.toJSON()
];

const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_TOKEN
);

(async () => {
    try {

        console.log("🔄 Registering commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log("✅ /movie registered!");
        console.log("✅ /library registered!");
        console.log("✅ /newmovie registered!");

    } catch (error) {

        console.error("❌ Registration failed:");
        console.error(error);

    }
})();