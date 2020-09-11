#!/usr/bin/env ts-node-script

// create matchings of a two station trip and the corresponding railway route numbers for preferred routes
// requires ts-node (https://github.com/TypeStrong/ts-node)

import { findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr } from '../dist/db-data'
import { PreferredRoute, RailwayRouteOfTrip } from '../dist/db-data-railway-routes'
const fs = require('fs');

function findRailwayRouteOfTrip(route: number, fromDs100Pattern: string, toDs100Pattern: string): RailwayRouteOfTrip {
    const rrPosFrom = findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(route).find(bs => bs.KUERZEL === fromDs100Pattern);
    const rrPosTo = findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(route).find(bs => bs.KUERZEL === toDs100Pattern);
    return {
        railwayRouteNr: route,
        from: {
            ds100_ref: fromDs100Pattern,
            name: rrPosFrom?.BEZEICHNUNG ?? "",
            railwayRoutePosition: rrPosFrom
        },
        to: {
            ds100_ref: toDs100Pattern,
            name: rrPosTo?.BEZEICHNUNG ?? "",
            railwayRoutePosition: rrPosTo
        }
    }
}

const preferredroutes: PreferredRoute[] = [];

// see https://de.wikipedia.org/wiki/Bahnstrecke_Elberfeld%E2%80%93Dortmund
preferredroutes.push({
    ds100From: "EHG",
    ds100To: "EDO,EDO N",
    railwayRoutes: [
        findRailwayRouteOfTrip(2801, "EHG", "EWIT"),
        findRailwayRouteOfTrip(2140, "EWIT", "ESTR"),
        findRailwayRouteOfTrip(2125, "ESTR", "EDO,EDO N")
    ]
});
preferredroutes.push({
    ds100From: "EWIT",
    ds100To: "EDO,EDO N",
    railwayRoutes: [
        findRailwayRouteOfTrip(2140, "EWIT", "ESTR"),
        findRailwayRouteOfTrip(2125, "ESTR", "EDO,EDO N")
    ]
});

fs.writeFile("./db-data/generated/preferredroutes.json", JSON.stringify(preferredroutes), function (err: any) {
    if (err) {
        console.log(err);
    }
});
