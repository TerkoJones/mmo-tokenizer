import { Token, Tokenizer, TokenizerState } from "../src";
import { inspect } from "util";
import { HPathStep } from "./hpath/hpath-state";

export const tokenViewer = (tokenizer: Tokenizer) => {
	return (token: Token) => {
		const value = `"${token.value}"`;
		return `- ${value.padStart(14)}: ${tokenizer.tokenName(token.type)}`;
	}
}

export const stepView = (step: HPathStep) => inspect(step, { compact: true });
