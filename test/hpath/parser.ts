import { TokenType, info, hpathTokenizer } from "./hpath-tokenizer";
import { HPathState, HPathStep } from "./hpath-state";
import { Token, Tokenizer } from "../../src";
import { message, ERR } from "./errors";
import { Transformer } from './expression';
import { type } from "os";


export interface HPathParserResult {
	absolut: boolean,
	steps: HPathStep[],
	error: string
}

export const hpathParser = function (query: string): HPathParserResult {
	const state = new HPathState(query);

	let token: Token | null;

	if (state.char() === info.slash) {
		state.absolut = true;
		state.ignoreNext();
	}


	while (state.ok) {
		token = hpathTokenizer.next(state);

		if (token === null) {

			state.error = message(ERR.UK_TOKEN, state.char());
			break;//(>

		}
		else if (
			token.type === TokenType.NAME
		) {

			if (!state.ensureNoPendings(token)) break;//:(>
			state.push(token);

		} else if (
			token.type === TokenType.WILDCARD ||
			token.type === TokenType.ASCERISK
		) {

			if (!state.ensureNoPendings(token)) break;//:(>
			if (!state.setTest(token)) break;//:(>

		} else if (
			token.type === TokenType.AXE_SEPARATOR
		) {

			if (!state.ensurePendings(token)) break;//:(>
			token = state.pop();
			if (!state.setAxe(token)) break; //:(>

		} else if (
			token.type === TokenType.DOT
		) {

			if (
				state.predicate ||
				state.parser
			) {
				state.error = message(ERR.UNX_TOKEN, token.value);
				break; //:(>
			}
			state.recoverTest();
		} else if (
			token.type === TokenType.BRACKET_OPEN
		) {

			if (
				state.predicate ||
				state.parser ||
				!state.ensureTestFor(token)
			) break; //:(>

			if (!predicateParser(state)) break; //:(>

		} else if (
			token.type === TokenType.ANGLE
		) {

			if (
				state.parser ||
				!state.ensureTestFor(token)
			) break; //:(>
			if (!parserParser(state)) break; //:(>

		} else if (
			token.type === TokenType.SLASH
		) {

			if (
				!state.ensureTestFor(token)
			) break;
			state.addStep();

		} else {
			state.error = message(ERR.UNX_TOKEN, token.value);
			break;
		}
	}

	if (!state.error) {
		if (!state.predicate && !state.parser) state.recoverTest();
		if (state.test) state.addStep()
	}
	return {
		absolut: state.absolut,
		steps: state.steps,
		error: state.error
	}
}


const parserParser = (state: HPathState) => {
	if (!state.test) {
		state.error = message(ERR.NO_TEST);
		return false;
	}
	if (state.parser) {
		state.error = message(ERR.UNX_TOKEN, info.angle);
		return false;
	}
	const token = hpathTokenizer.next(state);
	if (token === null) {
		state.error = message(ERR.NO_PARSER);
		return false;
	}
	if (token.type !== TokenType.NAME) {
		state.error = message(ERR.UK_TOKEN, token.value);
		return false;
	}
	state.parser = token.value;
	return true;
}

const predicateParser = (state: HPathState) => {
	const expr = expressionTransform(state);
	if (expr != null) {
		state.predicate = expr;
		return true;
	}
	return false;
}


export const expressionTransform = (state: HPathState): string | null => {
	const
		itor: Iterator<Token> = predicateTokenGenerator(state, TokenType.BRACKET_CLOSE),
		trans = new Transformer();

	let
		done: boolean | undefined,
		token: Token,
		tmp: Token | null;

	({ done, value: token } = itor.next());

	while (!done && !state.error) {

		switch (token.type) {
			case TokenType.FUNCTION:
				tmp = createFuctionToken(token.value, itor, state);
				if (tmp === null) return null; //:(>
				trans.push(tmp);
				break;

			default:
				trans.push(token)
		}

		if (trans.error) {
			state.error = trans.error;
			return null; //:)>
		}

		({ done, value: token } = itor.next());

	}

	return trans.release();
}


export const createFuctionToken = (fnName: string, itor: Iterator<Token>, state: HPathState): Token | null => {
	const
		arr: string[] = [];

	let
		trans: Transformer,
		done: boolean | undefined,
		token: Token,
		tmp: string | null,
		arg: boolean,
		ac = 0;

	({ done, value: token } = itor.next());

	while (!done && !state.error) {
		trans = new Transformer();
		arg = false;
		do {
			switch (token.type) {
				case TokenType.PARENTHESIS_OPEN:
					ac++;
					trans.push(token)
					break;

				case TokenType.PARENTHESIS_CLOSE:
					done = (ac-- === 0)
					if (!done) trans.push(token)
					break;

				case TokenType.COMMA:
					arg = true;
					break;

				default:
					trans.push(token)
			}

			if (!done) {
				if (trans.error) {
					state.error = trans.error;
					break;
				}

				({ done, value: token } = itor.next());
			}

		} while (!arg && !done && !state.error);

		if (!state.error) {

			tmp = trans.release();
			if (trans.error) {
				state.error = trans.error;
				return null //:(>
			}
			arr.push(tmp!);

		}
	}

	return state.error ? null : {
		type: Transformer.RESOLVED,
		value: `${fnName}(${arr.join(', ')})`
	}

}


const mergeStackedNamedTokens = (state: HPathState): Token | null => {

	let res: Token[] = [];
	while (state.pending) res.unshift(state.pop());
	let type = TokenType.ELEMENT;
	if (res[0].type === TokenType.ATTR_PREFIX) {
		/**@todo  comprobar que sólo hay un elemento Error a state y sale null */
		res.shift();
		type = TokenType.ATTRIBUTE;
	} else if (res[0].type === TokenType.DOLLAR) {
		res.shift();
		type = TokenType.VARIABLE;
	}

	return {
		type,
		value: res.map(tk => tk.value).join('.')
	}
}


const checkIfPendingName = (state: HPathState): Token | null => {
	if (state.pending) return mergeStackedNamedTokens(state);
	return null;
}



export const predicateTokenGenerator = function* (state: HPathState, endType: number) {
	let token: Token | null;
	let prev: Token | null;



	while (state.ok && (token = hpathTokenizer.next(state))) {

		switch (token.type) {
			case endType:

				prev = checkIfPendingName(state);
				if (state.error) return; //:(>
				if (prev !== null) yield prev;
				return; //:)>

			case TokenType.OPERATOR:
			case TokenType.ASCERISK:
			case TokenType.ANGLE:
			case TokenType.SLASH:

				prev = checkIfPendingName(state);
				if (state.error) return;
				if (prev !== null) yield prev;

				token.type = TokenType.OPERATOR
				yield token;
				break;

			case TokenType.NUMBER:
			case TokenType.PARENTHESIS_CLOSE:
			case TokenType.BRACKET_CLOSE:
			case TokenType.COMMA:
			case TokenType.STRING:

				prev = checkIfPendingName(state);
				if (state.error) return;
				if (prev !== null) yield prev;
				yield token;
				break



			case TokenType.PARENTHESIS_OPEN:

				if (state.pending) {

					prev = checkIfPendingName(state);
					if (state.error) return;
					if (prev === null) {
						state.error = message(ERR.UNX_TOKEN, token.value);
						return; //:(>
					} else {
						prev.type = TokenType.FUNCTION;
						yield prev;
					}

				} else {

					prev = checkIfPendingName(state);
					if (state.error) return;
					if (prev !== null) yield prev;
					yield token;

				}
				break;

			case TokenType.NAME:

				state.push(token);
				break;

			case TokenType.DOT:

				if (!state.pending) {
					state.error = message(ERR.UNX_TOKEN, token.value);
					return; //:(>
				}
				break;

			case TokenType.ATTR_PREFIX:
			case TokenType.DOLLAR:

				if (state.pending) {
					state.error = message(ERR.UNX_TOKEN, token.value);
					return //:(>
				}

				state.push(token);
				break;

			default:
				state.error = message(ERR.UNX_TOKEN, token.value);
				return;//:(>
		}

	}

	state.error = message(ERR.EXPR_FAILED);
	return;

}
