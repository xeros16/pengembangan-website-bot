# Local Information Utilities — PIR Visuals v6.7.2

## Weather

Command: `.cuaca <nama kota>` (alias: `.weather <nama kota>`)

Example: `.cuaca Bandung`

The bot geocodes the city using Open-Meteo, then requests current temperature, apparent temperature, relative humidity, precipitation, wind speed, WMO weather code, and the day's minimum/maximum temperature. Responses include the place and local provider time. Results are cached in bounded memory for five minutes.

## Latest earthquake

Command: `.gempa`

The bot reads BMKG's latest public earthquake feed and formats the timestamp, magnitude, depth, region, coordinates, potential tsunami note, and felt report when supplied by BMKG.

## Reliability and safety

- Provider URLs are fixed in source; user input is used only as a geocoding search term.
- Requests have a nine-second timeout and concise failure messages.
- No API key or database migration is required.
- Weather is a public forecast/current-condition feed and may change. Earthquake information is not an emergency alert service; follow BMKG and local BPBD instructions.

## Staging checks still required

Confirm Open-Meteo geocoding/forecast responses and BMKG feed availability from the production host, then test Indonesian city names and common spelling variations.
