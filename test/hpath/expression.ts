import { Token } from "../../src";
import { TokenType, info } from "./hpath-tokenizer";
import { HPathState } from "./hpath-state";
import { message, ERR } from "./errors";

/** <resultado>,<error> */
type TransformResult = [string, string];

const ATTR_FN = "self._attr";
const ELMT_FN = "self._elmt";
const INDEX_FN = "self._inx";

/** true y si a tiene mayor o igual preferencia que b */
const hasPreference = (a: Token, b: Token) => {
	if (a.type === TokenType.PARENTHESIS_OPEN) return false;
	return info.operatorPriority(a.value) >= info.operatorPriority(b.value)
}

export class Transformer {

	/** Tipo para los tokens que no precisan ser transformados. */
	public static readonly RESOLVED = 100;


	private _sta: Token[] = [];
	private _res: Token[] = [];
	private _err: string = '';
	private _last: Token | null = null;

	public get error() { return this._err; }

	public push(token: Token): boolean {
		if (this._last !== null && this._last.type === TokenType.OPERATOR) {
			if (token.type === TokenType.OPERATOR && !info.isUnaryOperator(token.value)) {
				this._err = message(ERR.TWO_OPERATOR);
				return false;
			}
		}
		this._last = token;


		switch (token.type) {
			case TokenType.OPERATOR:
			case TokenType.FUNCTION:
				while (this._sta.length && hasPreference(this._sta.at(-1)!, token)) this._res.push(this._sta.pop()!);
				this._sta.push(token);
				return true;

			case TokenType.PARENTHESIS_OPEN:

				this._sta.push(token);
				return true;

			case TokenType.PARENTHESIS_CLOSE:

				while (this._sta.length && this._sta.at(-1)!.type !== TokenType.PARENTHESIS_OPEN) this._res.push(this._sta.pop()!);
				if (!this._sta.length || this._sta.at(-1)!.type != TokenType.PARENTHESIS_OPEN) {
					this._err = message(ERR.EXPR_FAILED);
					return false;

				}
				this._sta.pop();
				return true;

			case TokenType.NAME:
				this._res.push(token)
				return true;

			case TokenType.BRACKET_CLOSE:
				return true;
			default:
				this._res.push(token);
				return true;
		}
	}

	public release(): string | null {
		while (this._sta.length) this._res.push(this._sta.pop()!);
		return this._transpile();
	}

	private _transpileToken(token: Token): string {
		let res: string;
		if (token.type === TokenType.ATTRIBUTE) {
			res = `${ATTR_FN}('${token.value}')`
		} else if (token.type === TokenType.VARIABLE) {
			res = `${info.CONTEXT_PREFIX}${token.value}`
		} else if (token.type === TokenType.ELEMENT) {

			res = `${ELMT_FN}('${token.value}')`
		} else if (token.type === TokenType.STRING) {
			res = `'${token.value}'`
		} else {
			res = token.value;
		}
		return res;
	}

	private _transpile_function(token: Token, stack: string[]): string | null {
		let params = info.functionParams(token.value);
		if (params === null) {
			this._err = message(ERR.FUNC_UK, token.value);
			return null; //:(>
		}
		let args = [];
		while (--params >= 0 && stack.length) args.push(stack.pop()!);
		if (params >= 0) {
			this._err = message(ERR.FUNC_PARAM, token.value, info.functionParams(token.value));
			return null; //:)>
		}
		return `${token.value}(${args.reverse().join(',')})`;
	}

	private _transpile_operation(token: Token, stack: string[]): string {
		let res = info.operatorName(token.value);
		let op = '';
		if (!res) throw Error(`Unknow operator "${token.value}"`);
		if (stack.length) {
			op = stack.pop()!
			if (stack.length) op = stack.pop()! + ',' + op;
		}
		return `${res}(${op})`
	}


	private _transpile(): string | null {
		let i = -1;
		let token: Token;
		let aux: string | null;
		let err = '';
		let stack: string[] = [];
		while ((token = this._res[++i])) {
			switch (token.type) {
				case TokenType.OPERATOR:
					stack.push(this._transpile_operation(token, stack));
					break;
				case TokenType.FUNCTION:
					aux = this._transpile_function(token, stack);
					if (aux === null) return null; //:(>
					stack.push(aux);
					break;
				default:
					aux = this._transpileToken(token)
					stack.push(aux)
			}
		}
		if (stack.length != 1) {
			this._err = message(ERR.EXPR_FAILED);
			return null;
		}
		return stack[0];
	}



}


