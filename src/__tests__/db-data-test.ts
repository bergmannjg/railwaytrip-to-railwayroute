import { setVerbose, setStrategy, findRailwayRoutesOfTrip, findRailwayRoutePositionForRailwayRoutes } from '../db-data-railway-routes'

beforeAll(() => {
    setVerbose(true);
    setStrategy(true, false);
});

test('test Norddeich Rheine', () => {
    const stops = [8007768, 8001768, 8000316];
    const result = findRailwayRoutesOfTrip(stops);
    const railwayRoutes = result.railwayRoutes;
    expect(result.missing).toBe(0);
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1574);
    expect(railwayRoutes[1].railwayRouteNr).toBe(1570);
    expect(railwayRoutes[2].railwayRouteNr).toBe(2931);
});

test('test Hagen Dortmund', () => {
    const stops = [8000142, 8000080];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2801);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2140);
    expect(railwayRoutes[2].railwayRouteNr).toBe(2125);
});

test('test Hagen Witten Dortmund', () => {
    const stops = [8000142, 8000251, 8000080];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2801);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2140);
    expect(railwayRoutes[2].railwayRouteNr).toBe(2125);
});

test('test Norden Jever', () => {
    const stops = [8000800, 8003124]; // route has closure
    const result = findRailwayRoutesOfTrip(stops);
    const railwayRoutes = result.railwayRoutes;
    expect(result.missing).toBe(0);
    expect(railwayRoutes.length).toBe(5);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1570);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2931);
    expect(railwayRoutes[2].railwayRouteNr).toBe(1520);
    expect(railwayRoutes[3].railwayRouteNr).toBe(1522);
    expect(railwayRoutes[4].railwayRouteNr).toBe(1540);
});

test('test Oldenburg Emden', () => {
    const stops = [8000291, 8000770, 8004610, 8000664, 8000225, 8001768];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1520);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2931);
    expect(railwayRoutes[2].railwayRouteNr).toBe(1570);
});

test('test Köln Süd Erftstadt', () => {
    const stops = [8003361, 8003671];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2630);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2631);

    expect(railwayRoutes[0].to?.ds100_ref).toBe('KKAS');
    expect(railwayRoutes[0].to?.railwayRoutePosition?.STRECKE_NR).toBe(2630);

    expect(railwayRoutes[1].from?.ds100_ref).toBe('KKAS');
    expect(railwayRoutes[1].from?.railwayRoutePosition?.STRECKE_NR).toBe(2631);
});

test('test Ulm Augsburg', () => {
    const stops = [8000170, 8000013];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(1);
    expect(railwayRoutes[0].railwayRouteNr).toBe(5302);

    // const positions = findRailwayRoutePositionForRailwayRoutes(railwayRoutes);
    // expect(positions.length).toBe(15);
});

test('test ICE 73 Hamburg Freiburg', () => {
    const stops = [8002549, 8000152, 8000128, 8003200, 8000105, 8000244, 8000191, 8000191, 8000774, 8000290, 8000107];
    const result = findRailwayRoutesOfTrip(stops);
    const railwayRoutes = result.railwayRoutes;
    expect(result.missing).toBe(0);
    expect(railwayRoutes.length.toString()).toMatch(/8|11/);
    if (railwayRoutes.length === 11) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2200);
        expect(railwayRoutes[1].railwayRouteNr).toBe(1720);
        expect(railwayRoutes[2].railwayRouteNr).toBe(1710);
        expect(railwayRoutes[3].railwayRouteNr).toBe(1733);
        expect(railwayRoutes[4].railwayRouteNr).toBe(3600);
        expect(railwayRoutes[5].railwayRouteNr).toBe(3520);
        expect(railwayRoutes[6].railwayRouteNr).toBe(4010);
        expect(railwayRoutes[7].railwayRouteNr).toBe(4080);
        expect(railwayRoutes[8].railwayRouteNr).toBe(4082);
        expect(railwayRoutes[9].railwayRouteNr).toBe(4020);
        expect(railwayRoutes[10].railwayRouteNr).toBe(4000);
    } else {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2200);
        expect(railwayRoutes[1].railwayRouteNr).toBe(1720);
        expect(railwayRoutes[2].railwayRouteNr).toBe(1710);
        expect(railwayRoutes[3].railwayRouteNr).toBe(1733);
        expect(railwayRoutes[4].railwayRouteNr).toBe(3900);
        expect(railwayRoutes[5].railwayRouteNr).toBe(3520);
        expect(railwayRoutes[6].railwayRouteNr).toBe(4010);
        expect(railwayRoutes[7].railwayRouteNr).toBe(4000);
    }
});

test('test ICE 1581 Hamburg München', () => {
    const stops = [8002549, 8000147, 8000152, 8000128, 8003200, 8000115, 8000260, 8000284, 8000183, 8000261];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length.toString()).toMatch(/9|10/);
    if (railwayRoutes.length === 10) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2200);
        expect(railwayRoutes[1].railwayRouteNr).toBe(1720);
        expect(railwayRoutes[2].railwayRouteNr).toBe(1710);
        expect(railwayRoutes[3].railwayRouteNr).toBe(1733);
        expect(railwayRoutes[4].railwayRouteNr).toBe(5209);
        expect(railwayRoutes[5].railwayRouteNr).toBe(5910);
        expect(railwayRoutes[6].railwayRouteNr).toBe(5900);
        expect(railwayRoutes[7].railwayRouteNr).toBe(5850);
        expect(railwayRoutes[8].railwayRouteNr).toBe(5934);
        expect(railwayRoutes[9].railwayRouteNr).toBe(5501);
    }
    if (railwayRoutes.length === 9) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2200);
        expect(railwayRoutes[1].railwayRouteNr).toBe(1720);
        expect(railwayRoutes[2].railwayRouteNr).toBe(1710);
        expect(railwayRoutes[3].railwayRouteNr).toBe(1733);
        expect(railwayRoutes[4].railwayRouteNr).toBe(5910);
        expect(railwayRoutes[5].railwayRouteNr).toBe(5900);
        expect(railwayRoutes[6].railwayRouteNr).toBe(5850);
        expect(railwayRoutes[7].railwayRouteNr).toBe(5934);
        expect(railwayRoutes[8].railwayRouteNr).toBe(5501);
    }
})

test('test ICE 651 Köln Berlin', () => {
    const stops = [8000207, 8000087, 8000266, 8000142, 8000149, 8000036, 8000152, 8006552, 8010404, 8098160];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length.toString()).toMatch(/10|11/);
    if (railwayRoutes.length === 10) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2670);
        expect(railwayRoutes[1].railwayRouteNr).toBe(2652);
        expect(railwayRoutes[2].railwayRouteNr).toBe(2730);
        expect(railwayRoutes[3].railwayRouteNr).toBe(2731);
        expect(railwayRoutes[4].railwayRouteNr).toBe(2550);
        expect(railwayRoutes[5].railwayRouteNr).toBe(2852);
        expect(railwayRoutes[6].railwayRouteNr).toBe(2932);
        expect(railwayRoutes[7].railwayRouteNr).toBe(1700);
        expect(railwayRoutes[8].railwayRouteNr).toBe(1730);
        expect(railwayRoutes[9].railwayRouteNr).toBe(6107);
    }
    if (railwayRoutes.length === 11) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2670);
        expect(railwayRoutes[1].railwayRouteNr).toBe(2652);
        expect(railwayRoutes[2].railwayRouteNr).toBe(2730);
        expect(railwayRoutes[3].railwayRouteNr).toBe(2731);
        expect(railwayRoutes[4].railwayRouteNr).toBe(2550);
        expect(railwayRoutes[5].railwayRouteNr).toBe(2840);
        expect(railwayRoutes[6].railwayRouteNr).toBe(2103);
        expect(railwayRoutes[7].railwayRouteNr).toBe(2932);
        expect(railwayRoutes[8].railwayRouteNr).toBe(1700);
        expect(railwayRoutes[9].railwayRouteNr).toBe(1730);
        expect(railwayRoutes[10].railwayRouteNr).toBe(6107);
    }
})

test('test Hagen Bielefeld', () => {
    const stops = [8000142, 8000036];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(5);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2550);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2840);
    expect(railwayRoutes[2].railwayRouteNr).toBe(2103);
    expect(railwayRoutes[3].railwayRouteNr).toBe(2932);
    expect(railwayRoutes[4].railwayRouteNr).toBe(1700);
});

test('test Hagen Hamm', () => {
    const stops = [8000142, 8000149];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(4);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2550);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2840);
    expect(railwayRoutes[2].railwayRouteNr).toBe(2103);
    expect(railwayRoutes[3].railwayRouteNr).toBe(2932);
});

test('test Hamm Berlin', () => {
    const stops = [8000149, 8000036, 8000152, 8006552, 8010404, 8098160];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1700);
    expect(railwayRoutes[1].railwayRouteNr).toBe(1730);
    expect(railwayRoutes[2].railwayRouteNr).toBe(6107);
});

test('test Lübeck Fehmarn-Burg', () => {
    const stops = [8000237, 8001274];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1100);
    expect(railwayRoutes[1].railwayRouteNr).toBe(1103)

    const locations = findRailwayRoutePositionForRailwayRoutes(railwayRoutes, true);
    console.log('locations.length:', locations.length)
    expect(locations.length > 0).toBe(true)
});

test('test x', () => {
    const KM_I = 114350090;
    const x = KM_I - 100000000;
    const d1_meter = Math.trunc(x / 10000) * 100;
    const d2_meter = Math.trunc(x % 100);
    const d_meter = d1_meter + d2_meter;

    expect(d_meter).toBe(143590);
});

test('test Osnabrück Hbf Bielefeld', () => {
    const stops = [8000294, 8003956, 8000059, 8003288, 8002824, 8000162, 8000036];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2992);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2981);
    expect(railwayRoutes[2].railwayRouteNr).toBe(1700);
});

test('test Osnabrück Bielefeld', () => {
    const stops = [8000294, 8000059, 8003288, 8002824, 8000162, 8000036];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2992);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2981);
    expect(railwayRoutes[2].railwayRouteNr).toBe(1700);
});

test('test Hamburg Hannover', () => {
    const stops = [8002549, 8000152];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2200);
    expect(railwayRoutes[1].railwayRouteNr).toBe(1720);
    expect(railwayRoutes[2].railwayRouteNr).toBe(1710);
});

test('test Frankurt Mannheim', () => {
    const stops = [8000105, 8000244];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(3520);
    expect(railwayRoutes[1].railwayRouteNr).toBe(4010);
});

test('test Hannover Berlin', () => {
    const stops = [8000152, 8098160];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1730);
    expect(railwayRoutes[1].railwayRouteNr).toBe(6107)
});

test('test Nürnberg Ingolstadt shortest path', () => {
    const stops = [8000284, 8000183];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(5850);
    expect(railwayRoutes[1].railwayRouteNr).toBe(5934);
    expect(railwayRoutes[2].railwayRouteNr?.toString()).toMatch(/5501|5851/);
});

test('test Würzburg Nürnberg', () => {
    const stops = [8000260, 8000284];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(5910);
    expect(railwayRoutes[1].railwayRouteNr).toBe(5900);
});

test('test Hannover Wolfsburg', () => {
    const stops = [8000152, 8006552];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1730);
    expect(railwayRoutes[1].railwayRouteNr).toBe(6107)

    const locations = findRailwayRoutePositionForRailwayRoutes(railwayRoutes, true);
    console.log('locations.length:', locations.length)
    expect(locations.length > 0).toBe(true)
});

test('test Frankfurt Köln', () => {
    const stops = [8000105, 8070003, 8000207];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(5);
    expect(railwayRoutes[0].railwayRouteNr).toBe(3520);
    expect(railwayRoutes[1].railwayRouteNr).toBe(3627);
    expect(railwayRoutes[2].railwayRouteNr).toBe(2690);;
    expect(railwayRoutes[3].railwayRouteNr).toBe(2651);;
    expect(railwayRoutes[4].railwayRouteNr).toBe(2639);;
})

test('test Nürnberg München', () => {
    const stops = [8000284, 8000261];
    const railwayRoutes = findRailwayRoutesOfTrip(stops).railwayRoutes;
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(5850);
    expect(railwayRoutes[1].railwayRouteNr).toBe(5934);
    expect(railwayRoutes[2].railwayRouteNr).toBe(5501);
});
