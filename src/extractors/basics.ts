import { TokenExtractor, CharCodePredicate } from "../types";
import { TokenizerState } from "../tokenizer-state";
import * as chars from '../char-predicates'


export const nameToken = (
	startPred: CharCodePredicate = chars.isNameStartChar,
	bodyPred: CharCodePredicate = chars.isNameChar
): TokenExtractor => {

	return function (type: number) {
		if (startPred(this.codePoint())) {
			while (this.next() && bodyPred(this.codePoint()));
			return {
				type,
				value: this.getToken()
			}
		}
		return null;
	}
}

export const isoToken = (
	predicate: CharCodePredicate = chars.isSpaceChar
): TokenExtractor => {

	return function (type: number) {
		if (predicate(this.codePoint())) {
			while (this.next() && predicate(this.codePoint()));
			return {
				type,
				value: this.getToken()
			};
		}
		return null;
	}
}


export const spaceToken = (
	predicate: CharCodePredicate = chars.isSpaceChar,
	endOfLine: string = '\n'
): TokenExtractor => {

	if (endOfLine.length === 1) {
		return function (type: number) {
			if (predicate(this.codePoint())) {
				if (this.char() === endOfLine) this.newLine();
				while (this.next() && predicate(this.codePoint())) {
					if (this.char() === endOfLine) this.newLine();
				};
				return {
					type,
					value: this.getToken()
				}
			}
			return null;
		}
	} else {
		const fc = endOfLine[0];
		const rest = endOfLine.substring(1);
		return function (type: number) {
			if (predicate(this.codePoint())) {
				if (this.char() === fc && this.checkFollowing(rest)) this.newLine();
				while (this.next() && predicate(this.codePoint())) {
					if (this.char() === fc && this.checkFollowing(rest)) this.newLine();
				};
				return {
					type,
					value: this.getToken()
				};
			}
			return null;
		}
	}
}


export const quotedToken = (
	quotePredicate: CharCodePredicate = chars.isQuote,
	quotablePredicate: CharCodePredicate = chars.isQuotableChar
): TokenExtractor => {

	return function (type: number) {
		if (quotePredicate(this.codePoint())) {
			const quote = this.char();
			while (this.next() && quotablePredicate(this.codePoint()) && this.char() !== quote);
			if (this.char() === quote) {
				const value = this.getToken(1);
				this.ignoreNext();
				return {
					type,
					value
				};
			}
			this.restorePointer();
		}
		return null;
	}
}


export const numberToken = (
	digitPredicate: CharCodePredicate = chars.isDigit,
	decimalSeparator = '.'
): TokenExtractor => {

	return function (type: number) {
		if (digitPredicate(this.codePoint()) || this.char() === decimalSeparator) {
			let point = this.char() === decimalSeparator;
			while (this.next() && (digitPredicate(this.codePoint()) || this.char() === decimalSeparator)) {
				if (this.char() === decimalSeparator) {
					if (point) break;
					point = true;
				}
			}
			if ((point && this.consumed > 1) || !point) {
				return {
					type,
					value: this.getToken()
				};
			}
			this.restorePointer();
		}
		return null;
	}
}

