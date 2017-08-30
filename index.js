#!/usr/bin/env node

const jsonexport = require('jsonexport')
const fs = require('fs')
const program = require('commander')

function save (results, output = 'output.json') {
  fs.writeFile(output, results, error => {
    if (error) {
      throw error
    }
  })
}

program
  .arguments('<file>')
  .version('0.2.0')
  .option('-f, --format <format>', 'Format of the output JSON, or CSV', 'json')
  .option('-k, --apikey <apikey>', 'Your Full Contact API key')
  .option('-l, --lookup <lookup>', 'Use the person method to request more information about a specific person by email, phone or Twitter. Default email.', /^(email|twitter|phone)$/i, 'email')
  .option('-o, --output <output>', 'Output file, default output.json', 'output.json')
  .action(file => {
    // Get queries list
    const queries = fs.readFileSync(file, 'utf8').toString().split('\n')

    // Set options
    const { apikey, format, lookup, output } = { ...program }
    const contacts = []

    console.debug(apikey, lookup, output, queries.length)

    // Initiate Full Contact SDk
    const fullcontact = require('fullcontact-node')({
      // for v2 APIs. See: https://www.fullcontact.com/developer/
      apiKey: apikey
    })

    queries.forEach(query => {
      console.info(`${lookup}: ${query}`)

      // Build and send a Full Contact API call
      fullcontact.v2.person.lookup({
        [lookup]: query
      })
        .then(response => {
          const profiles = {}

          // Remap social accounts into a dictionary
          response.socialProfiles.forEach(profile => {
            profiles[profile.type] = {
              url: profile.url,
              username: profile.username,
              bio: profile.bio
            }
          })

          contacts.push({
            fullName: response.contactInfo.fullName,
            City: response.demographics.locationDeduced.normalizedLocation,
            Country: response.demographics.locationDeduced.country.name,
            LIBio: profiles.linkedin ? profiles.linkedin.bio : '',
            [lookup]: query,
            TwitterURL: profiles.twitter ? profiles.twitter.url : '',
            LinkedinURL: profiles.linkedin ? profiles.linkedin.url : '',
            FacebookURL: profiles.facebook ? profiles.facebook.url : '',
            AngelListURL: profiles.angellist ? profiles.angellist.url : '',
            KloutURL: profiles.klout ? profiles.klout.url : '',
            YoutubeURL: profiles.youtube ? profiles.youtube.url : ''
          })

          if (format.toLowerCase() === 'csv') {
            jsonexport(contacts, (error, csv) => {
              if (error) {
                throw error
              } else {
                save(csv, output)
              }
            })
          } else {
            save(JSON.stringify(contacts), output)
          }
        })
        .catch(response => {
          console.error('error %s', query, response.status, response.message)
        })
    })
  })
  .parse(process.argv)
