import { CharCodePredicate } from "./types";

export const isNameStartChar: CharCodePredicate = (code: number): boolean => (code >= 0x41 && code <= 0x5a) ||
	(code >= 0x61 && code <= 0x7a) ||
	(code === 0x5f) ||
	// (code === 0x3a) ||
	(code >= 0xC0 && code <= 0xD6) ||
	(code >= 0xD8 && code <= 0xF6) ||
	(code >= 0xF8 && code <= 0x2FF) ||
	(code >= 0x370 && code <= 0x37D) ||
	(code >= 0x37F && code <= 0x1FFF) ||
	(code >= 0x200C && code <= 0x200D) ||
	(code >= 0x2070 && code <= 0x218F) ||
	(code >= 0x2C00 && code <= 0x2FEF) ||
	(code >= 0x3001 && code <= 0xD7FF) ||
	(code >= 0xF900 && code <= 0xFDCF) ||
	(code >= 0xFDF0 && code <= 0xFFFD) ||
	(code >= 0x10000 && code <= 0xEFFFF);

export const isNameChar: CharCodePredicate = (code: number): boolean => isNameStartChar(code) ||
	(code >= 0x30 && code <= 0x39) ||
	(code === 0x2d) ||
	(code === 0x26)

export const isSpaceChar: CharCodePredicate = (code: number) => (code === 0x20) || (code === 0x09) || (code === 0x0D) || (code === 0x0A);

export const isDigit: CharCodePredicate = (code: number) => (code >= 0x30 && code <= 0x39);
export const isHexDigit: CharCodePredicate = (code: number) => (code >= 0x30 && code <= 0x39) ||
	(code >= 0x61 && code <= 0x66) ||
	(code >= 0x41 && code <= 0x46)

export const isEndOfLine: CharCodePredicate = (code: number) => code === 0x0a;
export const isQuote: CharCodePredicate = (code: number) => code === 0x22 || code === 0x27;
export const isQuotableChar: CharCodePredicate = (code: number) => code !== 0x0a;
export const isLetter: CharCodePredicate = (code: number) => _isLetter(String.fromCharCode(code));
export const isLowerCase: CharCodePredicate = (code: number) => _isLowerCase(String.fromCharCode(code));
export const isUpperCase: CharCodePredicate = (code: number) => _isUpperCase(String.fromCharCode(code));

const _isLetter = (char: string) => char.toUpperCase() != char.toLowerCase();
const _isUpperCase = (char: string) => char.toUpperCase() != char.toLowerCase() && char === char.toUpperCase()
const _isLowerCase = (char: string) => char.toUpperCase() != char.toLowerCase() && char === char.toLowerCase()
