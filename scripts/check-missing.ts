#!/usr/bin/env ts-node-script
// search for stations of typ 'FV' not in betriebsstellen_open_data.json

import type { Stop, BetriebsstelleRailwayRoutePosition, Betriebsstelle } from '../dist/db-data'

const stations = require('../db-data/original/D_Bahnhof_2020_alle.json') as Array<Stop>
const betriebsstellenStreckeNr = require('../db-data/original/betriebsstellen_open_data.json') as Array<BetriebsstelleRailwayRoutePosition>
const betriebsstellen = require('../db-data/original/DBNetz-Betriebsstellenverzeichnis-Stand2018-04.json') as Array<Betriebsstelle>

stations.forEach(s => {
    if (s.Verkehr === "FV") {
        const splitDs100 = s.DS100.split(',');
        const countFound = splitDs100.reduce((accu, ds) => {
            const entry = betriebsstellenStreckeNr.find(bs => bs.KUERZEL === ds);
            if (entry) accu++;
            return accu;
        }, 0)
        if (countFound === 0) {
            console.log('ds100 not found:', s.DS100, s.NAME)
        }
    }
})

function stripSpace(s: string) {
    return s.replace(/\s+/g, '');
}

stations.forEach(s => {
    if (s.Verkehr === "FV") {
        const splitDs100 = s.DS100.split(',');
        splitDs100.forEach(ds => {
            const entry = betriebsstellen.find(bs => bs.Abk === ds);
            if (entry && stripSpace(entry.Name) != stripSpace(s.NAME)) {
                console.log("Ds100", ds, ", Name ungleich:", entry.Name, s.NAME)
            }
        })
    }
})
