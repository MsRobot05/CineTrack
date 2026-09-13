# 🎬 CineTrackAPP

> An AI-powered Discord movie tracking and recommendation bot built with **Node.js, Discord.js, MySQL, OMDb API, and Ollama**.

CineTrackAPP helps Discord server members search for movies, manage their personal watchlists, mark movies as watched, rate movies, suggest movies to other members, and get AI-powered movie recommendations.

It also includes an automatic **New Movie Drop** system that can notify a Discord channel about upcoming/recent movie releases.

---

# ✨ Features

## 🎬 Movie Search

Use:

/movie <movie-name>

Example:

/movie Interstellar

CineTrack displays:

- 🎬 Movie title
- 📅 Release year
- ⭐ IMDb rating
- 🎭 Genre
- ⏱️ Runtime
- 🎬 Director
- 👥 Cast
- 📝 Full plot/description
- 🖼️ Movie poster
- ▶️ YouTube trailer search

---

# 📌 Bucket List

Users can save movies they want to watch.

After searching for a movie using `/movie`, click:

📌 **Bucket**

The movie is added to that user's personal Bucket List.

Each user has their own Bucket List.

---

# ☑️ Watched Movies

Users can mark a movie as watched.

Click:

☑️ **Watched**

CineTrack stores:

- Discord user
- Username
- Movie
- Watched date

---

# ⏳ Not Watched

CineTrack can show movies that are in the user's Bucket List but have not yet been watched.

Use:

/library

Then select:

⏳ **To Watch**

---

# 💡 Movie Suggestions

Users can suggest movies to the whole server.

After searching for a movie:

/movie Inception

Click:

💡 **Suggest**

CineTrack records:

- Movie
- Discord user
- Username
- Suggestion date

Other members can see who suggested the movie.

Example:

💡 Movie Suggestions

1. Inception (2010)

👤 Suggested by: ani03518
⭐ IMDb: 8.8

This allows members to discover movies recommended by other people in the server.

---

# ⭐ Movie Ratings

Users can rate movies from:

0 - 10

After `/movie`, click:

⭐ **Rate**

Example:

8.5

CineTrack saves the rating for that user.

Users can see their ratings through:

/library

→ ⭐ Ratings

---

# 🤖 AI Movie Assistant

CineTrack includes a local AI movie assistant using:

**Ollama + Gemma 3 4B**

The AI runs locally instead of requiring an OpenAI API key.

This means you can use the AI without paying for OpenAI API usage.

Example:

/ask Recommend a movie similar to Interstellar

The AI can provide movie recommendations based on:

- Genres
- Themes
- Story
- Science fiction
- Action
- Drama
- Characters
- Similar movies
- User preferences

---

# ▶️ YouTube Trailer

Movie searches include a:

▶️ Trailer

button.

The button opens a YouTube search for:

Movie Name + Year + Official Trailer

Example:

Interstellar 2014 official trailer

This allows users to quickly find the trailer.

---

# 🆕 Automatic New Movie Drops

CineTrack includes an automatic movie release notification system.

When the bot starts:

🆕 Automatic New Movie Drop system started.

The system checks movie release information automatically.

If movies are found, CineTrack can post them into the configured:

#new-movie-drops

channel.

The movie notification can contain:

- 🆕 Movie title
- 📅 Release date
- 🖼️ Poster
- ⭐ IMDb rating
- 🎭 Genre
- 📝 Description
- ▶️ YouTube trailer button

The system uses India time:

Asia/Kolkata

---

# 📚 Commands

CineTrack currently provides the following slash commands:

## 🎬 /movie

Search for a movie or TV series.

Example:

/movie Interstellar

---

## 📚 /library

Open your CineTrack library.

Example:

/library

The library contains:

📌 Bucket List

☑️ Watched

⏳ To Watch

💡 Suggestions

⭐ Ratings

---

## 🆕 /newmovie

Test/check the New Movie Drop system.

Example:

/newmovie

---

## 🤖 /ask

Ask the CineTrack AI assistant a movie-related question.

Example:

/ask Recommend movies like Interstellar

Another example:

/ask Give me 5 psychological thriller movies

---

# 🗂️ Project Structure

```text
CineTrackBot/
│
├── ai/
│   └── cineAgent.js
│
├── commands/
│   ├── movie.js
│   ├── library.js
│   ├── newmovie.js
│   └── ask.js
│
├── database.js
│
├── index.js
│
├── deploy-commands.js
│
├── newMovieDrops.js
│
├── package.json
│
├── package-lock.json
│
├── .env
│
└── README.md
