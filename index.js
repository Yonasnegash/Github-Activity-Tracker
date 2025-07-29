const https = require('https')
const readline = require('readline')
const fs = require('fs')
const path = require('path')

const ACTIVITY_CACHE_DIR = path.join(__dirname, '.cache/activity')
const USER_INFO_CACHE_DIR = path.join(__dirname, '.cache/user-info')

const usernameFromArg = process.argv[2]

if (!fs.existsSync(ACTIVITY_CACHE_DIR)) {
  fs.mkdirSync(ACTIVITY_CACHE_DIR)
}

if (!fs.existsSync(USER_INFO_CACHE_DIR)) {
  fs.mkdirSync(USER_INFO_CACHE_DIR)
}

function loadFromCache(dir, filename) {
  const filePath = path.join(dir, `${filename}.json`);
  if (!fs.existsSync(filePath)) return null;

  const stats = fs.statSync(filePath);
  const cacheAge = (Date.now() - stats.mtime) / (1000 * 60); // minutes

  if (cacheAge < 10) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  return null;
}

function saveToCache(dir, filename, data) {
  const filePath = path.join(dir, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function prompt(callback) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.question('Enter GitHub username: ', (input) => {
        rl.close()
        callback(input)
    })
}

function getUsername() {
    if (usernameFromArg) {
        return Promise.resolve(usernameFromArg)
    } else {
        return new Promise((resolve) => {
            prompt(resolve)
        })
    }
}

function fetchGitHubActivity(username) {
    const options = {
        hostname: 'api.github.com',
        path: `/users/${username}/events`,
        method: 'GET',
        headers: {
            'User-Agent': 'github-activity-cli',
            'Accept': 'application/vnd.github.v3+json'
        }
    }

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                if (res.statusCode === 404) {
                    return reject(new Error('User not found'))
                } 

                if (res.statusCode !== 200) {
                    return reject(new Error(`Failed to fetch activity (Status: ${res.statusCode})`))
                }

                try {
                    const events = JSON.parse(data)
                    resolve(events)
                } catch (error) {
                    reject(new Error('Failed to parse response'))
                }
            })
        })

        req.on('error', (err) => reject(err))
        req.end()
    })
}

function displayActivity(events) {
  if (events.length === 0) {
    console.log('No recent public activity found.');
    return;
  }

  events.forEach(event => {
    const repo = event.repo.name;
    const type = event.type;

    switch (type) {
      case 'PushEvent':
        const commitCount = event.payload.commits.length;
        console.log(`Pushed ${commitCount} commit(s) to ${repo}`);
        break;
      case 'IssuesEvent':
        const action = event.payload.action;
        console.log(`${capitalize(action)} an issue in ${repo}`);
        break;
      case 'WatchEvent':
        console.log(`Starred ${repo}`);
        break;
      case 'ForkEvent':
        console.log(`Forked ${repo}`);
        break;
      default:
        break;
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function fetchUserInfo(username) {
  const options = {
    hostname: 'api.github.com',
    path: `/users/${username}`,
    method: 'GET',
    headers: {
      'User-Agent': 'github-activity-cli',
      'Accept': 'application/vnd.github.v3+json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error('Could not fetch user profile.'));
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON for user profile.'));
        }
      })
    })

    req.on('error', (err) => reject(err))
    req.end()
  })
}

function displayUserInfo(user) {
  console.log(`\n👤 ${user.name || user.login}`);
  if (user.bio) console.log(`📝 ${user.bio}`);
  console.log(`🌍 ${user.location || 'Location not specified'}`);
  console.log(`📦 Public Repos: ${user.public_repos} | 👥 Followers: ${user.followers}`);
}

// main function
async function main() {
  try {
    const username = await getUsername();
    console.log(`Fetching activity and user info for ${username}...`);

    const cachedActivity = loadFromCache(ACTIVITY_CACHE_DIR, username);
    const cachedUserInfo = loadFromCache(USER_INFO_CACHE_DIR, username);
    
    if (cachedActivity) {
      console.log('(Loaded activity from cache)');
      displayActivity(cachedActivity);
    } else {
      const events = await fetchGitHubActivity(username);
      saveToCache(ACTIVITY_CACHE_DIR, username, events);
      displayActivity(events);
    }

    if (cachedUserInfo) {
      console.log('(Loaded user info from cache)');
      displayUserInfo(cachedUserInfo);
    } else {
      const userInfo = await fetchUserInfo(username);
      saveToCache(USER_INFO_CACHE_DIR, username, userInfo);
      displayUserInfo(userInfo);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

