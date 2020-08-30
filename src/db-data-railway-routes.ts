import { computeDistanceOfKmI, findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern, findRailwayRoute, findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr, findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForDS100, findStopForUicRef } from './db-data'
import type { RailwayRoutePosition, StopWithRailwayRoutePositions, BetriebsstelleRailwayRoutePosition } from './db-data'
import { addStopToGraph } from './db-data-graph'
import { Dijkstra } from './dijkstra'
import type { Graph } from './dijkstra'

// import rc from '../../db-data/generated/RailwayRouteCache.json';
const railwayRouteCache: RailwayRouteCache[] = [];

const graph = require('../db-data/generated/graph.json') as Graph;

const dijkstra = new Dijkstra();
const verbose = false;

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

interface RailwayRouteCache {
    uicFrom: number;
    uicTo: number;
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

function findStopWithRailwayRoutePositions(uicrefs: number[]) {
    return uicrefs.reduce((accu: StopWithRailwayRoutePositions[], uicref) => {
        const hs = findStopForUicRef(uicref);
        if (hs) {
            const streckenpositionen =
                hs.streckenpositionen ??
                findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern(hs.DS100);
            if (verbose) console.log('uic_ref:', uicref, ', Ds100:', hs.DS100, ', name:', hs.NAME, ', streckenpositionen:', streckenpositionen.length, ', from cache:', hs.streckenpositionen !== undefined)
            if (!hs.streckenpositionen) {
                hs.streckenpositionen = streckenpositionen;
            }
            if (streckenpositionen.length > 0) {
                accu.push({ ds100_ref: hs.DS100, uic_ref: uicref, name: hs.NAME, streckenpositionen });
            } else {
                accu.push({ ds100_ref: hs.DS100, uic_ref: uicref, name: hs.NAME, streckenpositionen });
            }
        } else {
            accu.push({ ds100_ref: '', uic_ref: uicref, name: '', streckenpositionen: [] });
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

function buildStopWithRailwayRoutePosition(streckennummer: number, hspos: StopWithRailwayRoutePositions): BetriebsstelleWithRailwayRoutePosition {
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

function findRailwayRoutesFromCache(state: State, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions): State {
    const cache = railwayRouteCache.find(c => hs_pos_von.uic_ref === c.uicFrom && hs_pos_bis.uic_ref === c.uicTo);
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

function findRailwayRoutesFromPath(state: State, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions): State {
    hs_pos_von.ds100_ref = getFirstPartOfDS100(hs_pos_von.ds100_ref)
    hs_pos_bis.ds100_ref = getFirstPartOfDS100(hs_pos_bis.ds100_ref)
    addStopToGraph(graph, hs_pos_von);
    addStopToGraph(graph, hs_pos_bis);

    const path = dijkstra.find_path(graph, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref);
    if (verbose) console.log('hs_pos_von', hs_pos_von.ds100_ref, ', hs_pos_bis', hs_pos_bis.ds100_ref, ', path', path)
    if (path.length === 2) {
        state.success = true;

        const intersection = hs_pos_von.streckenpositionen.find(a => hs_pos_bis.streckenpositionen.find(b => a.STRECKE_NR === b.STRECKE_NR));
        if (intersection) {
            const lastRailwayRoute = state.railwayRoutes.length > 0 ? state.railwayRoutes[state.railwayRoutes.length - 1] : undefined;
            if (lastRailwayRoute && lastRailwayRoute.railwayRouteNr === intersection.STRECKE_NR) {
                lastRailwayRoute.to = buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_bis)
            } else {
                state.actualRailwayRoute = {
                    railwayRouteNr: intersection.STRECKE_NR,
                    from: buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_von),
                    to: buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_bis)
                }
                state.railwayRoutes.push(state.actualRailwayRoute);
            }
            state.actualRailwayRoute = undefined;
        }
    } else if (path.length > 2) {
        state.success = true;

        const arrBs: BetriebsstelleRailwayRoutePosition[] = [];
        let prevPositions = hs_pos_von.streckenpositionen;
        path.forEach(p => {
            if (p !== hs_pos_von.ds100_ref) {
                let positions = p === hs_pos_bis.ds100_ref
                    ? hs_pos_bis.streckenpositionen
                    : findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForDS100(p);

                // minimize number of railway routes
                const intersections = prevPositions.filter(a => positions && positions.find(b => a.STRECKE_NR === b.STRECKE_NR));
                let shouldPush = intersections.length > 0;
                if (intersections.length > 1 && arrBs.length > 0) {
                    const lastStrecke = arrBs[arrBs.length - 1].STRECKE_NR;
                    shouldPush = !intersections.find(a => a.STRECKE_NR === lastStrecke);
                }
                if (shouldPush) {
                    const intersection = intersections[0];
                    if (arrBs.length === 0 || arrBs[arrBs.length - 1].STRECKE_NR !== intersection.STRECKE_NR) arrBs.push(intersection);
                }
                prevPositions = positions;
            }
        })
        const intersection = hs_pos_bis.streckenpositionen.find(a => prevPositions.find(b => a.STRECKE_NR === b.STRECKE_NR));
        if (intersection) {
            arrBs.push(intersection);
        }

        for (let n = 0; n < arrBs.length - 1; n++) {
            const bsPosOfA = arrBs[n];
            const bsPosOfB = arrBs[n + 1];
            const bsPosOfBWithRouteOfA = findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern(bsPosOfB.KUERZEL).find(bs => bs.STRECKE_NR === bsPosOfA.STRECKE_NR);
            addToState(state, bsPosOfA.STRECKE_NR, { ds100_ref: bsPosOfA.KUERZEL, name: bsPosOfA.BEZEICHNUNG, railwayRoutePosition: bsPosOfA }, { ds100_ref: bsPosOfB.KUERZEL, name: bsPosOfB.BEZEICHNUNG, railwayRoutePosition: bsPosOfBWithRouteOfA }, 'path')
        }
    }

    return state;
}

function findRailwayRoutesFromIntersections(state: State, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions): State {
    const intersection = hs_pos_von.streckenpositionen.find(a => hs_pos_bis.streckenpositionen.find(b => a.STRECKE_NR === b.STRECKE_NR));
    if (intersection) {
        state.success = true;
        if (verbose) console.log('found intersection: ', hs_pos_von.ds100_ref, intersection.STRECKE_NR, hs_pos_bis.ds100_ref)

        addToState(state, intersection.STRECKE_NR, buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_von), buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_bis), 'intersection')
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
                if (verbose) console.log(rule, ' push to state.railwayRoutes', state.actualRailwayRoute.railwayRouteNr)
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
function isSubStop(maybeSubStop: StopWithRailwayRoutePositions, stop: StopWithRailwayRoutePositions) {
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
function findRailwayRoutesOfTrip(uic_refs: number[], useCache?: boolean): RailwayRouteOfTripResult {
    const hs_pos_list = findStopWithRailwayRoutePositions(removeDuplicates(uic_refs));
    let state: State = { railwayRoutes: [], actualRailwayRoute: undefined, success: false }
    let missing = 0;
    for (let n = 0; n < hs_pos_list.length - 1; n++) {
        let hs_pos_from = hs_pos_list[n];
        const hs_pos_to = hs_pos_list[n + 1];
        if (n > 0 && isSubStop(hs_pos_from, hs_pos_list[n - 1])) {
            hs_pos_from = hs_pos_list[n - 1];
        }
        if (isSubStop(hs_pos_to, hs_pos_from)) {
            continue;
        }
        state.success = false;
        if (!state.success && useCache) {
            state = findRailwayRoutesFromCache(state, hs_pos_from, hs_pos_to);
        }
        if (!state.success) {
            state = findRailwayRoutesFromIntersections(state, hs_pos_from, hs_pos_to);
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
                state.railwayRoutes.push(state.actualRailwayRoute);
            }
        } else {
            state.railwayRoutes.push(state.actualRailwayRoute);
        }
    }
    return { railwayRoutes: state.railwayRoutes, missing };
}

export { verbose, findRailwayRoutesOfTrip, findRailwayRouteText, findRailwayRoute, computeDistanceOfRoutes, findBetriebsstellenWithRailwayRoutePositionForRailwayRouteNr, findRailwayRoutePositionForRailwayRoutes }

export type { RailwayRouteOfTrip, RailwayRouteCache }