#!/usr/bin/env node

const fs = require('fs')
const program = require('commander')

program
  .arguments('<file>')
  .version('0.1.0')
  .option('-k, --apikey <apikey>', 'Your Full Contact API key')
  .option('-l, --lookup <lookup>', 'Use the person method to request more information about a specific person by email, phone or Twitter. Default email.', /^(email|twitter|phone)$/i, 'email')
  .option('-o, --output <output>', 'Output file, default output.json', 'output.json')
  .action(file => {

    // Get queries list
    const queries = fs.readFileSync(file).toString().split('\n');

    // Set options
    const { apikey, lookup, output } = { ...program }
    const results = []

    console.debug(apikey, lookup, output, queries.length)

    // Initiate Full Contact SDk
    const fullcontact = require('fullcontact-node')({
      apiKey: apikey //for v2 APIs. See: https://www.fullcontact.com/developer/
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
          response.socialProfiles.forEach( profile => {
              profiles[profile.type] = {
                url: profile.url,
                username: profile.username,
                bio: profile.bio
              }
            }
          )

          results.push({
            fullName: response.contactInfo.fullName,
            City: response.demographics.locationDeduced.normalizedLocation,
            Country: response.demographics.locationDeduced.country.name,
            LIBio: profiles.linkedin ? profiles.linkedin.bio: '',
            [lookup]: query,
            TwitterURL: profiles.twitter ? profiles.twitter.url : '',
            LinkedinURL: profiles.linkedin ? profiles.linkedin.url : '',
            FacebookURL: profiles.facebook ? profiles.facebook.url : '',
            AngelListURL: profiles.angellist ? profiles.angellist.url : '',
            KloutURL: profiles.klout ? profiles.klout.url : '',
            YoutubeURL: profiles.youtube ? profiles.youtube.url : ''
          })

          fs.writeFile(output, JSON.stringify(results), function(error) {
            
            if (error) {
              throw error
            }

          })
        })
        .catch(response => {
          console.error('error %s', query, response.status, response.message)
        })
    })

  })
  .parse(process.argv);
