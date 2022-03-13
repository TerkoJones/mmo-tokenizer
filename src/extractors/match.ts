import { Token, TokenExtractor, CharCodePredicate } from "../types";
import { TokenizerState } from "../tokenizer-state";
import * as chars from '../char-predicates'


type MathIfOptions = {
	matchLower?: boolean, /** Si el valor a extraer ha de coincidir en la capitalidad */
	condLower?: boolean, /** Si el valor que condiciona la extración ha de coincidier en la capitaliadad */
	preceding?: boolean, /** Si el valor que condiciona la extración debe estar antes del extraido */
	not?: boolean /** Se el valore que condiciona la extracion debe o no estar presente */
}


/**
 * Devuelve un TokenExtractor que si el TokenizerState está apuntando a una cadena como la pasada la extrae
 * @param type tipo de token
 * @param str cadena a comprobar
 * @param lower ignora la capitalidad en el chequeo convirtiendo lo extraido a minúsculas
 * @returns TokenExtractor
 */
const _matchString = (
	str: string,
	lower = false
): TokenExtractor => {

	const checker = lower ? TokenizerState.prototype.checkFollowingToLowerCase : TokenizerState.prototype.checkFollowing;
	return function (type: number) {
		if (checker.call(this, str)) {
			return {
				type,
				value: this.getToken(-1, str.length)
			}
		}
		return null;
	}
}

/**
 * Devuelve un TokenExtractor que si el TokenizerState está apuntando a una cualquera cadenas
 * pasadas la extrae
 * @param type tipo de token
 * @param list Array con cadenas a comprobar
 * @param lower ignora la capitalidad en el chequeo convirtiendo lo extraido a minúsculas
 * @returns
 */
const _matchList = (
	list: string[],
	lower = false
): TokenExtractor => {

	const checkerWithOptions = lower ? TokenizerState.prototype.checkFollowingInListToLowerCase : TokenizerState.prototype.checkFollowingInList;
	return function (type: number) {
		let i = checkerWithOptions.call(this, list);
		if (i >= 0) return {
			type,
			value: this.getToken(-1, list[i].length)
		}
		return null;
	}
}


/**
 * Devuelve una función que determina si la posición apuntada TokenizerState
 * coincide o no con la cadena indicada según las opciones.
 * @param str cadena a comprobar
 * @param opt Opciones de la comprobación
 * @returns
 */
const _stringFunction = (
	lower?: boolean,
	preceding?: boolean
): (str: string) => boolean => {
	return [
		TokenizerState.prototype.checkFollowing,
		TokenizerState.prototype.checkFollowingToLowerCase,
		TokenizerState.prototype.checkPreceding,
		TokenizerState.prototype.checkPrecedingToLowerCase,
	][(preceding ? 2 : 0) + (lower ? 1 : 0)]
}


/**
 * Devuelve una función que determina si la posición apuntada por un TokenizerState
 * coincide o no con una de las cadenas ds la lista según las opciones.
 * @param list array de cadenas a comprobar
 * @param opt Opciones de la comprobación
 * @returns
 */
const _listFunction = (
	lower?: boolean,
	preceding?: boolean
): (list: string[]) => number => {
	return [
		TokenizerState.prototype.checkFollowingInList,
		TokenizerState.prototype.checkFollowingInListToLowerCase,
		TokenizerState.prototype.checkPrecedingInList,
		TokenizerState.prototype.checkPrecedingInListToLowerCase
	][(preceding ? 2 : 0) + (lower ? 1 : 0)]


}

/**
 * Comprueba si la posición apuntada por el TokenizerState coincide con la cadena o con una
 * de las cadenas pasadas y si es así lo extrae.
 *
 * Si se pasa lower a true, match ha de estar en minúsculas.
 *
 * @param type tipo del token a extraer
 * @param match Cadena o cadenas con que ha de coincidir el token
 * @param lower Se tiene en cuenta o no la capitalidad.
 * @returns Token extraido o null.
 */
export const match = (
	match: string | string[],
	lower = false
): TokenExtractor => {

	if (Array.isArray(match)) return _matchList(match, lower);
	else if (typeof match === 'string') return _matchString(match, lower)
	else throw TypeError("Expected string or array string")
}



const _matchStringString = (
	matchStr: string,
	condStr: string,
	options?: MathIfOptions
): TokenExtractor => {

	const opt = options || {};
	const checker = _stringFunction(opt.matchLower);
	const condChecker = _stringFunction(opt.condLower, opt.preceding)

	if (opt.not) {

		return function (type: number) {
			if (checker.call(this, matchStr) && !condChecker.call(this, condStr)) {
				return {
					type,
					value: this.getToken(-1, matchStr.length)
				}
			}
			return null;
		}

	} else {

		return function (type: number) {
			if (checker.call(this, matchStr) && condChecker.call(this, condStr)) {
				return {
					type,
					value: this.getToken(-1, matchStr.length)
				}
			}
			return null;
		}
	}
}


const _matchStringList = (
	mathStr: string,
	condList: string[],
	options?: MathIfOptions
): TokenExtractor => {
	const opt = options || {};
	const checker = _stringFunction(opt.matchLower);
	const condChecker = _listFunction(opt.condLower, opt.preceding)

	if (opt.not) {

		return function (type: number) {

			if (checker.call(this, mathStr) && condChecker.call(this, condList) < 0) {
				return {
					type,
					value: this.getToken(-1, mathStr.length)
				}
			}
			return null;
		}

	} else {

		return function (type: number) {
			if (checker.call(this, mathStr) && condChecker.call(this, condList) >= 0) {
				return {
					type,
					value: this.getToken(-1, mathStr.length)
				}
			}
			return null;
		}
	}
}


const _matchListList = (
	matchList: string[],
	condList: string[],
	options?: MathIfOptions
): TokenExtractor => {
	const opt = options || {};
	const checker = _listFunction(opt.matchLower);
	const condChecker = _listFunction(opt.condLower, opt.preceding)

	if (opt.not) {
		return function (type: number) {
			const ix = checker.call(this, matchList);
			if (ix >= 0 && condChecker.call(this, condList) < 0) {
				return {
					type,
					value: this.getToken(-1, matchList[ix].length)
				}
			}
			return null;
		}

	} else {

		return function (type: number) {
			const ix = checker.call(this, matchList);
			if (ix >= 0 && condChecker.call(this, condList) >= 0) {
				return {
					type,
					value: this.getToken(type, matchList[ix].length)
				}
			}
			return null;
		}
	}
}


const _matchListString = (
	matchList: string[],
	condStr: string,
	options?: MathIfOptions
): TokenExtractor => {
	const opt = options || {};
	const checker = _listFunction(opt.matchLower);
	const condChecker = _stringFunction(opt.condLower, opt.preceding)

	if (opt.not) {

		return function (type: number) {
			const ix = checker.call(this, matchList);
			if (ix >= 0 && !condChecker.call(this, condStr)) {
				return {
					type,
					value: this.getToken(-1, matchList[ix].length)
				}
			}
			return null;
		}

	} else {

		return function (type: number) {
			const ix = checker.call(this, matchList);
			if (ix >= 0 && condChecker.call(this, condStr)) {
				return {
					type,
					value: this.getToken(-1, matchList[ix].length)
				}
			}
			return null;
		}
	}
}

/**
 * Intenta extraer un token según el valor pasado
 * @param type tipo del token devueto
 * @param match Cadena o lista de ellas con que ha de coincidir el token(si es lista cualquiera de ellas).
 * @param cond Cadena o lista de cadenas que condicionan la extracción.
 * @param options Opciones de coincidencia.
 * @returns Token extraido o null si no lo hubo.
 */
export const matchIf = (
	match: string | string[],
	cond: string | string[],
	options?: MathIfOptions
): TokenExtractor => {

	if (Array.isArray(match)) {
		if (Array.isArray(cond)) {
			return _matchListList(match, cond, options)
		} else if (typeof cond === 'string') {
			return _matchListString(match, cond, options)
		}
	} else if (typeof match === 'string') {
		if (Array.isArray(cond)) {
			return _matchStringList(match, cond, options)
		} else if (typeof cond === 'string') {
			return _matchStringString(match, cond, options)
		}
	}
	throw new Error("Expected string or string array")
}
