# GitHub User Activity CLI

A simple command-line tool to fetch and display the recent public activity of a GitHub user. This CLI helps developers explore how to work with APIs, handle JSON data, and implement local caching — all using Node.js with **no external libraries**. Project URL : https://roadmap.sh/projects/github-user-activity

## 🔧 Features

- Fetches recent GitHub activity using the [GitHub Events API](https://docs.github.com/en/rest/activity/events).
- Displays activities like:
  - Pushed commits
  - Starred repositories
  - Opened/closed issues
- Shows basic user profile info (name, bio, followers, etc.)
- Caches data locally for 10 minutes to reduce API calls
- Handles invalid usernames and API errors gracefully

---

## 📦 Installation

1. Clone this repository:

```bash
git clone https://github.com/Yonasnegash/Github-Activity-Tracker.git
cd github-user-activity-cli
```

2. Run the script using Node.js:

```bash
node index.js
```

## 🗃️ Caching

It will prompt you to enter username interactively, provide username.

Fetched user activity is saved in a .cache/ folder and reused if it’s less than 10 minutes old. This reduces API calls and speeds up repeated requests.

## 🧪 Edge Cases Handled

- Invalid GitHub usernames (404)

- API rate limits or connection errors

- Empty activity logs

- Cache expiration and regeneration

## 📁 Project Structure

github-user-activity-cli/
├── index.js        # Main CLI script
├── .cache/         # Cached JSON responses (auto-created)
└── README.md

## 📚 Learning Goals

This project helps reinforce:

- Making HTTPS requests without external libraries

- Using Node.js built-in modules (https, fs, readline, path)

- Parsing JSON responses from APIs

- Implementing caching logic

- Building and handling a simple command-line interface

## 📝 License
This project is open-source and available under the MIT License.