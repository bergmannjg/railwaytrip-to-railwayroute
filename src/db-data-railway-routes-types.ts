interface BetriebsstelleRailwayRoutePosition {
    "STRECKE_NR": number;
    "RICHTUNG": number;
    "KM_I": number;
    "KM_L": string;
    "BEZEICHNUNG": string;
    "STELLE_ART": string;
    "KUERZEL": string;
    "GK_R_DGN": number | string;
    "GK_H_DGN": number | string;
    "GEOGR_BREITE": number;
    "GEOGR_LAENGE": number;
    maxSpeed?: number;
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

export type { RailwayRouteOfTripResult, RailwayRouteOfTrip, BetriebsstelleWithRailwayRoutePosition }