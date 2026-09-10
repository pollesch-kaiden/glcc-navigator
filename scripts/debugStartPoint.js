const graph = require('../assets/map/graph.json');

function haversine(a, b) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(x));
}

const start = [-89.0128168, 43.8205914];
const modes = ['walking', 'biking', 'golf_cart', 'car'];

for (const mode of modes) {
    let nearest = null;
    let minDist = Infinity;

    for (const [id, node] of Object.entries(graph.nodes)) {
        const hasValidEdge = node.connectedEdges.some((eid) =>
            graph.edges[eid].transportModes.includes(mode)
        );
        if (!hasValidEdge) continue;

        const d = haversine(start, node.coordinates);
        if (d < minDist) {
            minDist = d;
            nearest = id;
        }
    }

    console.log(`${mode}: ${nearest} — ${Math.round(minDist)}m away`);
}