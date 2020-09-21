import { computeDistanceOfKmI, findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern, findRailwayRoute, findBetriebsstelleForDS100Pattern, findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr, findStopForUicRef } from './db-data'
import type { RailwayRoutePosition, StopWithRailwayRoutePositions as BetriebsstelleWithRailwayRoutePositions, BetriebsstelleRailwayRoutePosition } from './db-data'
import { addStopToGraph } from './db-data-graph'
import { Dijkstra } from './dijkstra'
import type { Graph } from './dijkstra'

const preferredRoutes = require('../db-data/generated/preferredroutes.json') as PreferredRoute[];
const graph = require('../db-data/generated/graph.json') as Graph;

const dijkstra = new Dijkstra();

let verbose = false;
function setVerbose(_verbose: boolean) {
    verbose = _verbose;
}

let enablePreferredRoutes = true;
function setStrategy(_enablePreferredRoutes: boolean) {
    enablePreferredRoutes = _enablePreferredRoutes;
}

interface BetriebsstelleWithRailwayRoutePosition {
    ds100_ref: string;
    name: string;
    railwayRoutePosition?: BetriebsstelleRailwayRoutePosition;
}

interface RailwayRouteOfTrip {
    railwayRouteNr?: number;
    from?: BetriebsstelleWithRailwayRoutePosition;
    to?: BetriebsstelleWithRailwayRoutePosition;
}

interface RailwayRouteOfTripResult {
    railwayRoutes: RailwayRouteOfTrip[];
    missing: number;
}

interface PreferredRoute {
    ds100From: string;
    ds100To: string;
    railwayRoutes: Array<RailwayRouteOfTrip>;
}

function findBetriebsstellenWithRailwayRoutePositionForRailwayRouteNr(RailwayRouteNr: number): BetriebsstelleRailwayRoutePosition[] {
    return findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(RailwayRouteNr);
}

function findRailwayRoutePositionForRailwayRoutes(routes: RailwayRouteOfTrip[], allPoints: boolean): RailwayRoutePosition[] {
    return routes.reduce((accu: RailwayRoutePosition[], r) => {
        if (r.railwayRouteNr) {
            const arrBs = findBetriebsstellenWithRailwayRoutePositionForRailwayRouteNr(r.railwayRouteNr)
                .filter(bs => allPoints || (bs.KUERZEL === r.from?.ds100_ref || bs.KUERZEL === r.to?.ds100_ref || bs.STELLE_ART.startsWith('Bf')));
            arrBs.sort((x, y) => x.KM_I - y.KM_I);

            const from = arrBs.findIndex(s => s.KUERZEL === r.from?.ds100_ref)
            if (verbose) console.log('findIndex:', from, r.from?.ds100_ref)
            const to = arrBs.findIndex(s => s.KUERZEL === r.to?.ds100_ref)
            if (verbose) console.log('findIndex:', to, r.to?.ds100_ref)
            if (from !== -1 && from < to) {
                const slice = arrBs.slice(from, to + 1);
                accu = accu.concat(slice.map(s => { return { GEOGR_BREITE: s.GEOGR_BREITE, GEOGR_LAENGE: s.GEOGR_LAENGE } }))
            } else if (to !== -1 && to < from) {
                const slice = arrBs.slice(to, from + 1).reverse();
                accu = accu.concat(slice.map(s => { return { GEOGR_BREITE: s.GEOGR_BREITE, GEOGR_LAENGE: s.GEOGR_LAENGE } }))
            }
        }
        return accu;
    }, [])
}

function getFirstPartOfDS100(ds100: string) {
    const index = ds100.indexOf(',');
    if (index > 0) return ds100.substr(0, index);
    else return ds100;
}

function findDs100PatternsForUicrefs(uicrefs: number[]) {
    return uicrefs.map(uicref => findStopForUicRef(uicref).DS100);
}

function finddBetriebsstelleWithRailwayRoutePositions(ds100pattern: string) {
    const bs = findBetriebsstelleForDS100Pattern(ds100pattern);
    if (bs) {
        const streckenpositionen =
            bs.streckenpositionen ??
            findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern(ds100pattern)
                .map(b => { b.KUERZEL = bs.Abk; return b }); // normalize pattern
        if (verbose) console.log('Ds100:', ds100pattern, ', name:', bs.Name, ', streckenpositionen:', streckenpositionen.length, ', from cache:', bs.streckenpositionen !== undefined)
        if (!bs.streckenpositionen) {
            bs.streckenpositionen = streckenpositionen;
        }
    }
    return bs;
}

function finddBetriebsstellenWithRailwayRoutePositions(ds100patterns: string[]) {
    return ds100patterns.reduce((accu: BetriebsstelleWithRailwayRoutePositions[], ds100pattern) => {
        const bs = finddBetriebsstelleWithRailwayRoutePositions(ds100pattern);
        if (bs) {
            if (bs.streckenpositionen && bs.streckenpositionen.length > 0) {
                accu.push({ ds100_ref: bs.Abk, name: bs.Name, streckenpositionen: bs.streckenpositionen });
            } else {
                accu.push({ ds100_ref: bs.Abk, name: bs.Name, streckenpositionen: [] });
            }
        }
        return accu;
    }, []);
}

function removeDuplicates(arr: Array<number>) {
    const temp: Array<number> = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== arr[i + 1]) { temp.push(arr[i]); }
    }
    return temp;
}

function buildStopWithRailwayRoutePosition(streckennummer: number, hspos: BetriebsstelleWithRailwayRoutePositions): BetriebsstelleWithRailwayRoutePosition {
    const position = hspos.streckenpositionen.find(s => s.STRECKE_NR === streckennummer);
    return {
        ds100_ref: getFirstPartOfDS100(hspos.ds100_ref),
        name: hspos.name,
        railwayRoutePosition: position
    }
}

function findRailwayRouteText(railwayRouteNr: number): string {
    const route = findRailwayRoute(railwayRouteNr);
    return route ? route.STRKURZN : '';
}

function computeDistanceOfBetriebsstellen(strecke: number, ds100A: string, ds100B: string, distanceOfUndef?: number) {
    const bsAnStrecke = findBetriebsstellenWithRailwayRoutePositionForRailwayRouteNr(strecke);
    const nodeA = bsAnStrecke.find(s => s.KUERZEL === ds100A);
    const nodeB = bsAnStrecke.find(s => s.KUERZEL === ds100B);
    if (nodeA && nodeB) {
        return computeDistanceOfKmI(nodeA.KM_I, nodeB.KM_I) / 1000;
    } else {
        return distanceOfUndef ?? 0;
    }
}

function computeDistanceOfRoutes(routes: Array<RailwayRouteOfTrip>): number {
    return routes.reduce((accu: number, r) => {
        if (r.railwayRouteNr && r.from && r.to) {
            accu += computeDistanceOfBetriebsstellen(r.railwayRouteNr, r.from?.ds100_ref, r.to?.ds100_ref)
        }
        return accu;
    }, 0)
}

interface State {
    railwayRoutes: Array<RailwayRouteOfTrip>;
    actualRailwayRoute: RailwayRouteOfTrip | undefined;
    success: boolean;
}

function findRailwayRoutesFromPreferredRoutes(state: State, hs_pos_von: BetriebsstelleWithRailwayRoutePositions, hs_pos_bis: BetriebsstelleWithRailwayRoutePositions): State {
    const cache = preferredRoutes.find(c => hs_pos_von.ds100_ref === c.ds100From && hs_pos_bis.ds100_ref === c.ds100To);
    if (cache) {
        state.success = true;
        if (verbose) console.log('found cache: ', hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref)

        for (const route of cache.railwayRoutes) {
            if (route.railwayRouteNr && route.from && route.to) {
                addToState(state, route.railwayRouteNr, route.from, route.to, 'cache')
            }
        }
    }
    return state;
}

function getCostOfPath(graph: Graph, path: string[]) {
    let cost = 0;
    for (let n = 0; n < path.length - 1; n++) {
        cost = cost + graph[path[n]][path[n + 1]]
    }
    return cost;
}

interface Ds100BetriebsstelleRailwayRoutePositions {
    ds100: string;
    positions: BetriebsstelleRailwayRoutePosition[];
}

interface Ds100FromToBetriebsstelleRailwayRoutePositions {
    ds100From: string;
    ds100To?: Ds100BetriebsstelleRailwayRoutePositions;
    intersections: BetriebsstelleRailwayRoutePosition[];
}

interface Ds100FromToRoute {
    ds100From: string;
    ds100To: string;
    route: number;
}

function findRailwayRoutesFromPath(state: State, hs_pos_von: BetriebsstelleWithRailwayRoutePositions, hs_pos_bis: BetriebsstelleWithRailwayRoutePositions): State {
    hs_pos_von.ds100_ref = getFirstPartOfDS100(hs_pos_von.ds100_ref)
    hs_pos_bis.ds100_ref = getFirstPartOfDS100(hs_pos_bis.ds100_ref)
    addStopToGraph(graph, hs_pos_von);
    addStopToGraph(graph, hs_pos_bis);

    const path = dijkstra.find_path(graph, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref);
    if (verbose) console.log('path', path, ', cost:', getCostOfPath(graph, path))
    if (path.length > 1) {
        state.success = true;

        const positions: Ds100BetriebsstelleRailwayRoutePositions[] = path.map(p => {
            return {
                ds100: p,
                positions: p === hs_pos_von.ds100_ref
                    ? hs_pos_von.streckenpositionen :
                    p === hs_pos_bis.ds100_ref
                        ? hs_pos_bis.streckenpositionen :
                        finddBetriebsstelleWithRailwayRoutePositions(p)?.streckenpositionen ?? []
            }
        })

        let candidate: Ds100FromToBetriebsstelleRailwayRoutePositions | undefined;
        const ds100FromToRoutes: Ds100FromToRoute[] = []
        positions.forEach(p => {
            if (candidate) {
                const intersections = candidate.intersections.filter(a => p.positions.find(b => a.STRECKE_NR === b.STRECKE_NR))
                if (intersections.length > 0) {
                    candidate.ds100To = p;
                    candidate.intersections = intersections;
                } else if (candidate.ds100To) {
                    ds100FromToRoutes.push({
                        ds100From: candidate.ds100From,
                        ds100To: candidate.ds100To.ds100,
                        route: candidate.intersections[0].STRECKE_NR
                    })
                    candidate = {
                        ds100From: candidate.ds100To.ds100,
                        ds100To: p,
                        intersections: candidate.ds100To.positions.filter(a => p.positions.find(b => a.STRECKE_NR === b.STRECKE_NR))
                    };
                }
            } else {
                candidate = {
                    ds100From: p.ds100,
                    intersections: p.positions
                }
            }
        })
        if (candidate && candidate.ds100To) {
            ds100FromToRoutes.push({
                ds100From: candidate.ds100From,
                ds100To: candidate.ds100To.ds100,
                route: candidate.intersections[0].STRECKE_NR
            })
        }

        for (let n = 0; n < ds100FromToRoutes.length; n++) {
            const curr = ds100FromToRoutes[n];
            const bsPosOfA = findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern(curr.ds100From).find(bs => bs.STRECKE_NR === curr.route);;
            const bsPosOfB = findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern(curr.ds100To).find(bs => bs.STRECKE_NR === curr.route);
            if (bsPosOfA && bsPosOfB)
                addToState(state, curr.route,
                    { ds100_ref: bsPosOfA.KUERZEL, name: bsPosOfA.BEZEICHNUNG, railwayRoutePosition: bsPosOfA },
                    { ds100_ref: bsPosOfB.KUERZEL, name: bsPosOfB.BEZEICHNUNG, railwayRoutePosition: bsPosOfB }, 'path')
        }

    }

    return state;
}

function addToState(state: State, railwayRouteNr: number, from: BetriebsstelleWithRailwayRoutePosition, to: BetriebsstelleWithRailwayRoutePosition, rule: string) {
    if (state.actualRailwayRoute === undefined) {
        state.actualRailwayRoute = {
            railwayRouteNr,
            from,
            to
        }
    } else {
        if (state.actualRailwayRoute.railwayRouteNr === railwayRouteNr) {
            state.actualRailwayRoute.to = to;
        } else {
            if (state.actualRailwayRoute.to === undefined && state.actualRailwayRoute.railwayRouteNr) {
                state.actualRailwayRoute.to = from;
            }
            if (state.railwayRoutes.length === 0 || state.railwayRoutes[state.railwayRoutes.length - 1].railwayRouteNr !== state.actualRailwayRoute.railwayRouteNr) {
                if (verbose) console.log(rule, ' push to state.railwayRoutes', state.actualRailwayRoute.railwayRouteNr, state.actualRailwayRoute.from?.ds100_ref, state.actualRailwayRoute.to?.ds100_ref)
                state.railwayRoutes.push(state.actualRailwayRoute);
            }
            state.actualRailwayRoute = {
                railwayRouteNr,
                from,
                to
            };
        }
    }
}

// adhoc method to find substop
function isSubStop(maybeSubStop: BetriebsstelleWithRailwayRoutePositions, stop: BetriebsstelleWithRailwayRoutePositions) {
    return maybeSubStop.streckenpositionen.length === 0
        && stop.streckenpositionen.length > 0
        && maybeSubStop.ds100_ref.includes(stop.ds100_ref);
}

/**
 * find railway route numbers for the station codes of a trip,
 * the solution is not unique and there may be others with fewer railway routes.
 *
 * Search in the set of relations Betriebsstelle-RailwayRoute with the following steps:
 * 1) lookup cache (findRailwayRoutesFromCache)
 * 2) check if the stations have a common railway route (findRailwayRoutesFromIntersections)
 * 3) search using shortest path algorithm (Dijkstra) and minimize number of railway routes.
 *
 * @param uic_refs UIC station codes of trip
 * @param useCache use railwayRoute cache
 * @param routeSearchType search single or double crossings
 */
function findRailwayRoutesOfTrip(uic_refs: number[]): RailwayRouteOfTripResult {
    return findRailwayRoutesForDs100Patterns(findDs100PatternsForUicrefs(removeDuplicates(uic_refs)))
}

function findRailwayRoutesForDs100Patterns(ds100Patterns: string[]): RailwayRouteOfTripResult {
    const hs_pos_list = finddBetriebsstellenWithRailwayRoutePositions(ds100Patterns);
    let state: State = { railwayRoutes: [], actualRailwayRoute: undefined, success: false }
    let missing = 0;
    for (let n = 0; n < hs_pos_list.length - 1; n++) {
        let hs_pos_from = hs_pos_list[n];
        const hs_pos_to = hs_pos_list[n + 1];

        if (verbose) console.log('findRailwayRoute, hs_pos_from', hs_pos_from.ds100_ref, ', hs_pos_to', hs_pos_to.ds100_ref)

        if (n > 0 && isSubStop(hs_pos_from, hs_pos_list[n - 1])) {
            hs_pos_from = hs_pos_list[n - 1];
        }
        if (isSubStop(hs_pos_to, hs_pos_from)) {
            continue;
        }
        state.success = false;
        if (!state.success && enablePreferredRoutes) {
            state = findRailwayRoutesFromPreferredRoutes(state, hs_pos_from, hs_pos_to);
        }
        if (!state.success) {
            state = findRailwayRoutesFromPath(state, hs_pos_from, hs_pos_to);
        }
        if (!state.success) {
            missing++;
            if (verbose) console.log('found nothing: ', hs_pos_from.ds100_ref, hs_pos_to.ds100_ref)
        }
    }
    if (state.actualRailwayRoute !== undefined) {
        if (state.railwayRoutes.length > 0) {
            if (state.railwayRoutes[state.railwayRoutes.length - 1].railwayRouteNr !== state.actualRailwayRoute.railwayRouteNr) {
                if (verbose) console.log('path', ' push to state.railwayRoutes', state.actualRailwayRoute.railwayRouteNr);
                state.railwayRoutes.push(state.actualRailwayRoute);
            }
        } else {
            if (verbose) console.log('path', ' push to state.railwayRoutes', state.actualRailwayRoute.railwayRouteNr);
            state.railwayRoutes.push(state.actualRailwayRoute);
        }
    }
    return { railwayRoutes: state.railwayRoutes, missing };
}

export { setVerbose, setStrategy, findRailwayRoutesOfTrip, findRailwayRouteText, findRailwayRoute, computeDistanceOfRoutes, findBetriebsstellenWithRailwayRoutePositionForRailwayRouteNr, findRailwayRoutePositionForRailwayRoutes }

export type { RailwayRouteOfTrip, PreferredRoute }