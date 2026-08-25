/**
 * checkGraphConnectivity.ts
 * ─────────────────────────────────────────────────────────
 * Diagnostic script — checks how many separate "islands"
 * exist in the routing graph. A healthy campus path network
 * should be almost entirely one connected component.
 *
 * Usage: npx ts-node scripts/checkGraphConnectivity.ts
 * ─────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';

const graphFile = path.resolve(__dirname, '../assets/map/graph.json');
const graph = JSON.parse(fs.readFileSync(graphFile, 'utf-8'));

const visited = new Set<string>();
const components: string[][] = [];

function bfs(startId: string): string[] {
    const queue = [startId];
    const component: string[] = [];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        component.push(current);

        const node = graph.nodes[current];
        for (const edgeId of node.connectedEdges) {
            const edge = graph.edges[edgeId];
            const neighbor = edge.from === current ? edge.to : edge.from;
            if (!visited.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }

    return component;
}

for (const nodeId of Object.keys(graph.nodes)) {
    if (!visited.has(nodeId)) {
        components.push(bfs(nodeId));
    }
}

components.sort((a, b) => b.length - a.length);

console.log(`Total nodes: ${Object.keys(graph.nodes).length}`);
console.log(`Number of separate components (islands): ${components.length}`);
console.log(`\nLargest component: ${components[0].length} nodes`);
if (components.length > 1) {
    console.log(`\nSmaller isolated islands:`);
    components.slice(1, 10).forEach((c, i) => {
        console.log(`  Island ${i + 2}: ${c.length} nodes — e.g. ${c[0]}`);
    });
}