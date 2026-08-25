const graph = require('../assets/map/graph.json');

// Change this to whatever POI's nearestNodeId you want to inspect
const nodeId = process.argv[2];

if (!nodeId) {
    console.error('Usage: node scripts/debugPoiNode.js node-XXX');
    process.exit(1);
}

const node = graph.nodes[nodeId];

if (!node) {
    console.error(`Node ${nodeId} not found in graph`);
    process.exit(1);
}

console.log('Node coordinates:', node.coordinates);
console.log('Connected edges:');

for (const edgeId of node.connectedEdges) {
    const edge = graph.edges[edgeId];
    console.log(' -', edgeId, edge.transportModes, edge.distanceMeters + 'm');
}