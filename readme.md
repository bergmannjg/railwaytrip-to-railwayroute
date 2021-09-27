# Railway trip to railway route numbers

Uses [open data](./db-data/readme.md) from Deutsche Bahn to match the [UIC station codes](https://www.wikidata.org/wiki/Property:P722) of trips with [railway route numbers](https://en.wikipedia.org/wiki/German_railway_route_numbers).

Function *findRailwayRoutesOfTrip* in [db-data-railway-routes.ts](./src/db-data-railway-routes.ts).

**[RInfData](https://github.com/bergmannjg/RInfData) is the follow up project** using data from the European Register of Railway Infrastructure.

## Example

The trip from **8002549** (Hamburg) to **8000152** (Hannover) gives the following railway route numbers:

* **2200**: AH (Hamburg Hbf) to AHAR (Hamburg-Harburg),
* **1720**: AHAR (Hamburg-Harburg) to HC (Celle),
* **1710**: HC (Celle) to HH (Hannover Hbf).

