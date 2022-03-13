import { TokenExtractor, Token } from "./types";
import { TokenizerState } from "./tokenizer-state";


export type TokenDefinition = [number, string, TokenExtractor?, boolean?];


export class Tokenizer {
	private _types: number[] = [];
	private _names: string[] = [];
	private _ext: TokenExtractor[] = [];
	private _ignored: boolean[] = [];
	private _last = -1;

	constructor(
		...args: TokenDefinition[]
	) {
		let
			type: number,
			name: string,
			extractor: TokenExtractor | undefined,
			ignored: boolean | undefined;

		let endExtractors: boolean = false;

		for (let i = 0; i < args.length; i++) {
			[type, name, extractor, ignored] = args[i];
			this._createTokenType(type, name);
			if (extractor) {
				if (this._last > -1) throw 'Los tokens sin un extractor han de ir al final de la lista';
				this._ext.push(extractor);
			} else {
				if (this._last === -1) this._last = i;
				ignored = true;
			}
			this._ignored.push(!!ignored)
		}
		if (this._last < 0) this._last = args.length;
	}


	public tokenName(type: number) {
		const ix = this._types.indexOf(type);
		return ix < 0 ? '#UNKNOWN_TOKEN_TYPE' : this._names[ix];
	}

	public tokenType(name: string) {
		const ix = this._names.indexOf(name);
		return ix < 0 ? -1 : this._types[ix];
	}

	public get types() {
		return this._types.length;
	}

	// false si no hay ninguna coincidencia
	public next(state: TokenizerState): Token | null {
		let token: Token | null = null;
		for (let i = 0; i < this._last; i++) {
			if ((token = this._ext[i].call(state, this._types[i]))) {
				if (this._ignored[i]) return this.next(state); //:)>
				return token;
			}
		}
		return null;
	}

	public *generate(
		text: string
	) {
		const state = new TokenizerState(text);
		let token: Token | null;
		while (state.ok) {
			if (token = this.next(state)) {
				yield token;
			} else {
				yield {
					type: -1,
					value: state.char()
				};
				if (state.canceled) return;
				state.ignoreNext();
			}
		}
	}

	private _createTokenType(type: any, name: any) {
		if (typeof type !== 'number' || typeof name !== 'string') throw new TypeError("expected number, string[,number, string]*")
		if (this._types.includes(type)) throw new Error(`Already exists id type ${type} in tokenizer`);
		if (this._names.includes(name)) throw new Error(`Already exists name type ${name} in tokenizer`);
		this._names.push(name);
		this._types.push(type);
	}
}
