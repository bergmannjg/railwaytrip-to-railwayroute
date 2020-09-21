#!/usr/bin/env ts-node-script

// create graph for shortest path algorithm
// requires ts-node (https://github.com/TypeStrong/ts-node)

import { getBetriebsstellenWithRailwayRoutePositions, findStreckennutzungGeschwindigkeitForRailwayRouteNr } from '../dist/db-data'
import { addToGraph } from '../dist/db-data-graph'
import type { RailwayRouteDS100Endpoint, BetriebsstelleRailwayRoutePosition } from '../src/db-data'
import type { Graph } from '../src/dijkstra'
const routeEndpoints = require('../db-data/generated/route-endpoints-pz.json') as RailwayRouteDS100Endpoint[];

const fs = require('fs');

const ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions: { [index: string]: Array<BetriebsstelleRailwayRoutePosition> } = createIdxDs100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions();

function isEndpoint(ds100: string) {
    return routeEndpoints.find(ep => (ep.from?.Abk === ds100 || ep.to?.Abk === ds100)) !== undefined
}

function insertOrdered(arr: Array<BetriebsstelleRailwayRoutePosition>, somevalue: BetriebsstelleRailwayRoutePosition) {
    let added = false;
    for (let i = 0, len = arr.length; i < len; i++) {
        if (somevalue.KM_I < arr[i].KM_I) {
            arr.splice(i, 0, somevalue);
            added = true;
            break;
        }
    }
    if (!added) arr.push(somevalue);
    return arr;
}

function createIdxRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions() {
    const obj = {} as { [index: number]: Array<BetriebsstelleRailwayRoutePosition> };
    Object.keys(ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions)
        .forEach((k: string) => {
            ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions[k].forEach(bs => {
                const entry = obj[bs.STRECKE_NR] as Array<BetriebsstelleRailwayRoutePosition> | undefined;
                if (entry) insertOrdered(entry, bs);
                else obj[bs.STRECKE_NR] = [bs];
            })
        })

    return obj;
}

function createIdxDs100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions() {
    const obj = getBetriebsstellenWithRailwayRoutePositions()
        .reduce((accu, bs) => {
            const entry = accu[bs.KUERZEL];
            if (entry) entry.push(bs);
            else accu[bs.KUERZEL] = [bs];
            return accu;
        }, {} as { [index: string]: Array<BetriebsstelleRailwayRoutePosition> });

    // remove Ds100 items without crossings
    Object.keys(obj).forEach(k => {
        if (obj[k].length === 0 || (obj[k].length === 1 && !isEndpoint(obj[k][0].KUERZEL))) {
            delete obj[k];
        }
    })

    return obj;
}

function findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForDS100(ds100: string): BetriebsstelleRailwayRoutePosition[] {
    return ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions[ds100]
}

function getDs100ValuesForCrossingsOfBetriebsstellenWithRailwayRoutePositions(): string[] {
    return Object.keys(ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions)
}

const railwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions: { [index: number]: Array<BetriebsstelleRailwayRoutePosition> } = createIdxRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions();

function findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(railwayRouteNr: number): BetriebsstelleRailwayRoutePosition[] {
    return railwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions[railwayRouteNr] || []
}

function createGraph(): Graph {
    const g: Graph = {};
    getDs100ValuesForCrossingsOfBetriebsstellenWithRailwayRoutePositions()
        .forEach(k => {
            if (!g[k]) g[k] = {};
            findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForDS100(k).forEach(bs => {
                const speed = findStreckennutzungGeschwindigkeitForRailwayRouteNr(bs.STRECKE_NR);
                const positions = findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(bs.STRECKE_NR);
                if (positions) {
                    const bsOfK = positions.find(bsPos => bsPos.KUERZEL === k);
                    if (bsOfK) addToGraph(g, bsOfK, positions, true, speed);
                }
            })
            return false; // continue
        })

    const countNodes = Object.keys(g).length
    const countEdges = Object.keys(g).reduce((accu, k) => {
        accu += Object.keys(k).length;
        return accu
    }, 0);
    console.log('createGraph: nodes', countNodes, ', edges', countEdges)
    return g;
}

const g = createGraph();

fs.writeFile("./db-data/generated/graph.json", JSON.stringify(g), function (err: any) {
    if (err) {
        console.log(err);
    }
});

