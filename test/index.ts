import tester from "mmo-tester";
import extractorTest from './extractors-test'
import tokenizerTest from './tokenizer-test'
import { Token } from "../src";

async function main() {
	tester.config(tester.VERBOSITY_INFO)
	tester.run(
		extractorTest,
		tokenizerTest,
		'tokenizer'
	)
}
main();
