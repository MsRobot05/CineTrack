async function askCineAgent(userMessage) {
    try {
        console.log("🤖 Sending request to Ollama...");
        console.log("Question:", userMessage);

        const response = await fetch("http://localhost:11434/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gemma3:4b",

                messages: [
                    {
                        role: "system",
                        content: `
You are CineTrack AI, an intelligent movie assistant inside a Discord bot.

You help users with:
- Movies
- TV series
- Movie recommendations
- Movie discovery
- Watchlists
- Watched movies
- Movie ratings

Be friendly, concise and useful.

Do not invent movie information.
If you are unsure about something, say that you are unsure.
`
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],

                stream: false
            })
        });

        console.log("Ollama HTTP status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();

            console.error("❌ Ollama error:");
            console.error(errorText);

            throw new Error(
                `Ollama returned HTTP ${response.status}`
            );
        }

        const data = await response.json();

        console.log("✅ Ollama response received.");

        return data.message?.content ||
            "❌ CineTrack AI did not return an answer.";

    } catch (error) {
        console.error("❌ CineTrack AI error:", error);
        throw error;
    }
}

module.exports = {
    askCineAgent
};