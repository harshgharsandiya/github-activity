#!/usr/bin/env node

const https = require('https')

//get username from args
const username = process.argv[2]

if (!username) {
    console.error('Please provide a GitHub username.')
    console.error('Usage: github-activity <username>')
    process.exit(1)
}

// Github API URL
const url = `https://api.github.com/users/${username}/events`

const options = {
    headers: {
        'User-Agent': 'github-activity-cli',
        Accept: 'application/vnd.github+json',
    },
}

console.log(`Fetching recent activity for: ${username}...\n`)

https.get(url, options, (res) => {
    let data = ''

    if (res.statusCode === 404) {
        console.error('User not found. Check the username.')
        process.exit(1)
    }

    if (res.statusCode === 403) {
        console.error('API rate limit exceeded. Try again later.')
        process.exit(1)
    }

    res.on('data', (chunk) => (data += chunk))

    res.on('end', () => {
        try {
            const events = JSON.parse(data)

            if (!Array.isArray(events) || events.length === 0) {
                console.log('No recent activity found.')
                return
            }

            events.forEach((event) => {
                console.log(event.type)
                switch (event.type) {
                    case 'PushEvent':
                        const commits = event.payload.commits?.length || 0
                        console.log(
                            `• Pushed ${commits} commit(s) to ${event.repo.name}`
                        )
                    case 'IssuesEvent':
                        console.log(
                            `• ${event.payload.action} an issue in ${event.repo.name}`
                        )
                        break

                    case 'WatchEvent':
                        console.log(`• Starred ${event.repo.name}`)
                        break

                    case 'ForkEvent':
                        console.log(`• Forked ${event.repo.name}`)
                        break

                    case 'PullRequestEvent':
                        console.log(
                            `• ${event.payload.action} a pull request in ${event.repo.name}`
                        )
                        break

                    default:
                        console.log(`• ${event.type} in ${event.repo.name}`)
                }
            })
        } catch (error) {
            console.error(error)
            console.error('Failed to parse API response.')
        }
    }).on('error', (err) => {
        console.error('Network error:', err.message)
    })
})
