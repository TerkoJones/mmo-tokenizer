import { TokenizerState } from "./tokenizer-state";
export interface Token {
	type: number,
	value: string
}

export type CharCodePredicate = (code: number) => boolean;

/** Trata de extraer un token de la posición pauntada */
export type TokenExtractor = (this: TokenizerState, type: number) => Token | null;

/** Procesa el token extraido y en caso de error lo indica en estado */
export type TokenAdapter = (this: TokenizerState, token: Token) => Token | null;

