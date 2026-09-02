const ollama = require("ollama");

async function askCineAgent(userMessage) {
    const response = await ollama.chat({
        model: "gemma3:4b",

        messages: [
            {
                role: "system",
                content: `
You are CineTrack AI, an intelligent movie assistant inside Discord.

You help users with:
- Movies
- TV series
- Movie recommendations
- Watchlists
- Watched movies
- Ratings
- Movie discovery

Be helpful and concise.

At this stage, you are only answering questions.
Do not invent movie information.
`
            },
            {
                role: "user",
                content: userMessage
            }
        ]
    });

    return response.message.content;
}

module.exports = {
    askCineAgent
};