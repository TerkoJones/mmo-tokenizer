import tester from "mmo-tester";
import { Token, TokenizerState } from "../src";
import { demoTokenizer, TokenType } from "./demo-tokenizer";
import * as tool from './tools';

const tokenView = tool.tokenViewer(demoTokenizer);


export default () => {
	const test = tester("tokenizer");
	const str = "parent:div[@class='container']";
	const expected: Token[] = [
		{ type: TokenType.NAME, value: 'parent' },
		{ type: -1, value: ':' },
		{ type: TokenType.NAME, value: 'div' },
		{ type: TokenType.BRACKET_OPEN, value: '[' },
		{ type: TokenType.ATTR_PREFIX, value: '@' },
		{ type: TokenType.NAME, value: 'class' },
		{ type: TokenType.OPERATOR, value: '=' },
		{ type: TokenType.STRING, value: 'container' },
		{ type: TokenType.BRACKET_CLOSE, value: ']' }
	];
	test(str, function () {
		const arr = Array.from(demoTokenizer.generate(str));
		for (const tk of arr) {
			this.info(tokenView(tk))
		}
		this.equals(expected, arr, str);
	})

	test('Current Line', function () {
		const state = new TokenizerState("Line 1\nLine2");
		state.ignoreNext(2);
		this.equals(state.lineExtract(), 'ne 1', "lineExtract")
		this.equals(state.lineExtract(2), 'ne', "lineExtract")
	})

}
