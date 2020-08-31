#!/usr/bin/env ts-node-script
// search for route closures, file strecken_nutzung may be a hint

import type { RailwayRoute, Streckensperrung } from '../dist/db-data'

const streckenutzung = require('../db-data/original/strecken_nutzung.json') as Array<Streckenutzung>
const railwayRoutes = require('../db-data/original/strecken.json') as Array<RailwayRoute>
const fs = require('fs');

interface Streckenutzung {
    "mifcode": string;
    "strecke_nr": number;
    "richtung": number;
    "laenge": number;
    "von_km_i": number;
    "bis_km_i": number;
    "von_km_l": string;
    "bis_km_l": string;
    "elektrifizierung": string;
    "bahnnutzung": string;
    "geschwindigkeit": string;
    "strecke_kurzn": string;
    "gleisanzahl": string;
    "bahnart": string;
    "kmspru_typ_anf": string;
    "kmspru_typ_end": string;
}

const sperrungen: Streckensperrung[] = [];
const approved = [1023, 1570];

function checkRoute(r: RailwayRoute) {
    const sn = streckenutzung.filter(s => s.strecke_nr === r.STRNR && s.richtung === 0);
    sn.sort((x, y) => x.bis_km_i - y.bis_km_i);
    let prev: Streckenutzung | undefined;
    sn.forEach(curr => {
        if (prev) {
            if (curr.von_km_i === prev.von_km_i) {
            } else if (curr.von_km_i !== prev.bis_km_i) {
                console.log("route:", r.STRNR, prev.bis_km_l, curr.von_km_l)
                if (approved.find(i => i === r.STRNR)) {
                    sperrungen.push({ strecke_nr: r.STRNR, von_km_i: prev.bis_km_i, bis_km_i: curr.von_km_i })
                }
            }
        }
        prev = curr;
    })
}

railwayRoutes.forEach(r => {
    checkRoute(r);
})

fs.writeFile("./db-data/generated/streckensperrungen.json", JSON.stringify(sperrungen), function (err: any) {
    if (err) {
        console.log(err);
    }
});
