import { DifyDSL } from "../src/index.ts";

const inputPath = "../input/高考志愿推荐助手.yml";
const outputPath = "../output/roundtrip.yml";

console.log("Loading...");
const dsl = DifyDSL.load(inputPath);
console.log(`Nodes: ${dsl.graph.nodeCount}, Edges: ${dsl.graph.edgeCount}`);

console.log("Saving...");
dsl.save(outputPath);
console.log("Done.");
