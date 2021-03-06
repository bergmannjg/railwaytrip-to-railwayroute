const stops = require('../db-data/generated/stops.json') as Stop[];
const railwayRoutes = require('../db-data/generated/strecken_pz.json') as RailwayRoute[];
const betriebsstellenWithRailwayRoutePositions = require('../db-data/generated/betriebsstellen_streckennummer_pz.json') as BetriebsstelleRailwayRoutePosition[];
const streckensperrungen = require('../db-data/generated/streckensperrungen.json') as Streckensperrung[];
const betriebsstellen = require('../db-data/original/DBNetz-Betriebsstellenverzeichnis-Stand2018-04.json') as Betriebsstelle[];

// a stop is identified by EVA_NR (uic_ref) and is a Betriebsstelle
interface Stop {
    "EVA_NR": number;
    "DS100": string; // DS100 pattern
    "IFOPT": string;
    "NAME": string;
    "Verkehr": number | string;
    "Laenge": string;
    "Breite": string;
    "Betreiber_Name": string;
    "Betreiber_Nr": number | string;
    "Status": string;
}

// a Betriebsstelle is identified by Abk (DS100)
interface Betriebsstelle {
    "Abk": string;
    "Name": string;
    "Kurzname": string;
    "Typ": string;
    "Betr-Zust": string;
    "Primary location code": string;
    "UIC": string;
    "RB": number,
    "gültig von": number,
    "gültig bis": string;
    "Netz-Key": string;
    "Fpl-rel": string;
    "Fpl-Gr": string;
    streckenpositionen?: Array<BetriebsstelleRailwayRoutePosition>
}

interface RailwayRoute {
    "STRNR": number;
    "KMANF_E": number;
    "KMEND_E": number;
    "KMANF_V": string;
    "KMEND_V": string;
    "STRNAME": string;
    "STRKURZN": string;
}

interface RailwayRoutePosition {
    "GEOGR_BREITE": number;
    "GEOGR_LAENGE": number;
}

interface BetriebsstelleRailwayRoutePosition extends RailwayRoutePosition {
    "STRECKE_NR": number;
    "RICHTUNG": number;
    "KM_I": number;
    "KM_L": string;
    "BEZEICHNUNG": string;
    "STELLE_ART": string;
    "KUERZEL": string; // DS100
    "GK_R_DGN": number | string;
    "GK_H_DGN": number | string;
    maxSpeed?: number;
}

interface Streckensperrung {
    "strecke_nr": number;
    "von_km_i": number;
    "bis_km_i": number;
}


interface RailwayRouteDS100Endpoint {
    strecke: RailwayRoute;
    from?: Betriebsstelle;
    to?: Betriebsstelle;
}

interface StopWithRailwayRoutePositions {
    ds100_ref: string; // DS100 pattern
    name: string;
    streckenpositionen: Array<BetriebsstelleRailwayRoutePosition>;
}

const railwayRouteNrOfBetriebsstellenWithRailwayRoutePositions: { [index: number]: Array<BetriebsstelleRailwayRoutePosition> } = createIdxRailwayRouteNrOfBetriebsstellenWithRailwayRoutePositions();

function createIdxRailwayRouteNrOfBetriebsstellenWithRailwayRoutePositions() {
    return betriebsstellenWithRailwayRoutePositions
        .reduce((accu, bs) => {
            const entry = accu[bs.STRECKE_NR];
            if (entry) entry.push(bs);
            else accu[bs.STRECKE_NR] = [bs];
            return accu;
        }, {} as { [index: number]: Array<BetriebsstelleRailwayRoutePosition> })
}

const uicRefOfStops: { [index: number]: Stop } = createIdxUicRefOfStops();

function createIdxUicRefOfStops() {
    return stops.reduce((accu, s) => {
        accu[s.EVA_NR] = s;
        return accu;
    }, {} as { [index: number]: Stop })
}

function kmi_to_meter(km_i: number) {
    const x = km_i - 100000000;
    const d1_meter = Math.trunc(x / 10000) * 100;
    const d2_meter = Math.trunc(x % 100);
    return d1_meter + d2_meter;
}

function computeDistanceOfKmI(kmiFrom: number, kmiTo: number): number {
    const mtFrom = kmi_to_meter(kmiFrom);
    const mtTo = kmi_to_meter(kmiTo);
    if (mtFrom >= mtTo) return mtFrom - mtTo;
    else return mtTo - mtFrom;
}

function isBetween(km: number, kmiFrom: number, kmiTo: number): boolean {
    if (kmiFrom < kmiTo) return kmiFrom < km && km < kmiTo;
    else if (kmiFrom > kmiTo) return kmiTo < km && km < kmiFrom;
    return false;
}

function hasRouteClosure(route: number, kmiFrom: number, kmiTo: number): boolean {
    const sperrungen = streckensperrungen.filter(s => s.strecke_nr === route);
    return sperrungen.find(sp => isBetween(sp.von_km_i, kmiFrom, kmiTo)) !== undefined;
}

/*
 * examples for ds100 in haltestellen 'EBIL', 'EBIL,EBILP', 'KDN,KDN P', 'EHE P'
 */
function matchWithDS100(s: string, ds100: string, splitDs100: string[]) {
    if (s === ds100) return true;
    if (splitDs100.length === 0) return false;
    if (splitDs100.length >= 2) {
        if (s === splitDs100[0]) return true;
        if (s === splitDs100[1]) return true;
        if (splitDs100.length >= 3 && s === splitDs100[2]) return true;
    }
    return false;
}

function findBetriebsstelleForDS100Pattern(ds100Pattern: string) {
    const splitDs100 = ds100Pattern.indexOf(',') > 0 ? ds100Pattern.split(',') : [];
    const arrBs = betriebsstellen.filter(b => matchWithDS100(b.Abk, ds100Pattern, splitDs100));
    if (arrBs.length === 0) return undefined;
    else if (arrBs.length === 1) return arrBs[0];
    else {
        return arrBs.sort((a, b) => a.Abk.length - b.Abk.length)[0]; // return bs with shortest ds100 (Abk)
    }
}

function findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern(ds100Pattern: string): BetriebsstelleRailwayRoutePosition[] {
    const splitDs100 = ds100Pattern.indexOf(',') > 0 ? ds100Pattern.split(',') : [];
    return betriebsstellenWithRailwayRoutePositions.filter(b => matchWithDS100(b.KUERZEL, ds100Pattern, splitDs100));
}

function findStopForUicRef(uicref: number): Stop {
    return uicRefOfStops[uicref];
}

function findStreckennutzungGeschwindigkeitForRailwayRouteNr(railwayRouteNr: number): number {
    const max = railwayRouteNrOfBetriebsstellenWithRailwayRoutePositions[railwayRouteNr]
        .reduce((accu, bs) => {
            if (bs.maxSpeed && accu < bs.maxSpeed) {
                accu = bs.maxSpeed;
            }
            return accu;
        }, 0)
    return max > 0 ? max : 100
}

function findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(railwayRouteNr: number): BetriebsstelleRailwayRoutePosition[] {
    return railwayRouteNrOfBetriebsstellenWithRailwayRoutePositions[railwayRouteNr] || []
}

function getBetriebsstellenWithRailwayRoutePositions() {
    return betriebsstellenWithRailwayRoutePositions;
}

function findRailwayRoute(strecke: number): RailwayRoute | undefined {
    return railwayRoutes.find(s => s.STRNR === strecke);
}

export { getBetriebsstellenWithRailwayRoutePositions, hasRouteClosure, computeDistanceOfKmI, findBetriebsstelleForDS100Pattern, findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern, findRailwayRoute, findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr, findStreckennutzungGeschwindigkeitForRailwayRouteNr, findStopForUicRef }

export type { RailwayRouteDS100Endpoint, Streckensperrung, RailwayRoutePosition, StopWithRailwayRoutePositions, Stop, BetriebsstelleRailwayRoutePosition, Betriebsstelle, RailwayRoute }