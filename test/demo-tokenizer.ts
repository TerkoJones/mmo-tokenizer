import {
	TokenExtractor,
	Tokenizer,
	extractors,
	chars
} from "../src";



export enum TokenType {
	SLASH,
	NUMBER,
	STRING,
	WILDCARD,
	ASCERISK,
	ANGLE,
	DOLLAR,
	OPERATOR,
	PARENTHESIS_OPEN,
	PARENTHESIS_CLOSE,
	BRACKET_OPEN,
	BRACKET_CLOSE,
	COMMA,
	DOT,
	ATTR_PREFIX,
	AXE_SEPARATOR,
	NAME,
	SPACE,
	// No extraibles
	FUNCTION,
	ATTRIBUTE,
	ELEMENT,
	VARIABLE
}

const ENV_PREFIX = 'self.';
const CONTEXT_PREFIX = '$.';

const OPERATOR_NAME = 0;
const OPERATOR_PRIORITY = 1;
const OPERATOR_UNARY = 2;


/**
 * key: Operadores tal y como se ven en las expressiones
 * value[preference, unary]: Nombre de las funciones asociadas.
 * */
const operatorMap: Record<string, [string, number, boolean?]> = {
	'+': ['_add', 2, true],
	'-': ['_sub', 2, true], // unario y binario
	'*': ['_mult', 3],
	'/': ['_div', 3],
	'%': ['_mod', 3],
	'=': ['_eq', 1],
	'!=': ['_neq', 1],
	'>': ['_gt', 1],
	'>=': ['_gte', 1],
	'<': ['_lt', 1],
	'<=': ['_lte', 1],
	'||': ['_or', 0],
	'&&': ['_and', 0],
	'!': ['_not', 0, true]
}

const operatorPriority = (op: string): number => {
	const entry = operatorMap[op];
	return !entry ? 4 : entry[OPERATOR_PRIORITY]
}
const operatorName = (op: string): string => {
	const entry = operatorMap[op];
	return entry ? ENV_PREFIX + entry[OPERATOR_NAME] : '';
}

const isUnaryOperator = (op: string) => {
	return !!operatorMap[op][OPERATOR_UNARY];
}

const functionMaps = ((fns: Record<string, number>) => {
	const ret: Record<string, number> = {};
	for (let k in fns) ret[ENV_PREFIX + k] = fns[k];
	return ret;
})({
	match: 2
})

const functionParams = (name: string) => {
	return functionMaps[name] || null;
}

const operators = '+,-,/,%,=,!=,!==,>=,<=,<,&&,||,!'.split(',');
const operatorsSet = new Set(operators);
const slash = '/';
const ascerisk = '*';
const axeSeparator = '::';
const wildcards = '..,**'.split(',');
const angle = '>';
const dollar = '$';
const axeNameSet = new Set('ancestor,ancestor-or-self,attribute,chid,descendant,descendant-or-self,following,following-sibling,parent,preceding,preceding-sibling,self'.split(','))
const parserNameSet = new Set('integer,float,string'.split(','));

export const info = {
	operatorsSet,
	wildcards,
	axeNameSet,
	angle,
	slash,
	ascerisk,
	parserNameSet,
	axeSeparator,
	operatorPriority,
	operatorName,
	isUnaryOperator,
	functionMaps,
	functionParams,
	dollar,
	ENV_PREFIX,
	CONTEXT_PREFIX
}

const xslash = extractors.match(slash);
const xnumber = extractors.numberToken();
const xstring = extractors.quotedToken();
const xwildcard = extractors.match(wildcards);
const xdollar = extractors.match(dollar);
const xascerisk = extractors.match('*');
const xoperator = extractors.match(operators);
const xparenthesisOpen = extractors.match('(');
const xparenthesisClose = extractors.match(')');
const xbracketOpen = extractors.match('[');
const xbracketClose = extractors.match(']');
const xcomma = extractors.match(',');
const xdot = extractors.match('.');
const xangle = extractors.match(angle);
const xattrPrefix = extractors.match('@');
const xaxeSeparator = extractors.match(axeSeparator);
const xname = extractors.nameToken();
const xspace = extractors.isoToken(chars.isSpaceChar);


export const demoTokenizer = new Tokenizer(
	[TokenType.SLASH, "SLASH", xslash],
	[TokenType.NUMBER, "NUMBER", xnumber],
	[TokenType.STRING, "STRING", xstring],
	[TokenType.WILDCARD, "WILDCARD", xwildcard],
	[TokenType.DOLLAR, "DOLLAR", xdollar],
	[TokenType.ASCERISK, 'ASCERISK', xascerisk],
	[TokenType.OPERATOR, 'OPERATOR', xoperator],
	[TokenType.PARENTHESIS_OPEN, "PARENTHESIS_OPEN", xparenthesisOpen],
	[TokenType.PARENTHESIS_CLOSE, "PARENTHESIS_CLOSE", xparenthesisClose],
	[TokenType.BRACKET_OPEN, "BRACKET_OPEN", xbracketOpen],
	[TokenType.BRACKET_CLOSE, "BRACKET_CLOSE", xbracketClose],
	[TokenType.COMMA, "COMMA", xcomma],
	[TokenType.DOT, "DOT", xdot],
	[TokenType.ANGLE, "ANGLE", xangle],
	[TokenType.ATTR_PREFIX, "ATTR_PREFIX", xattrPrefix],
	[TokenType.AXE_SEPARATOR, "AXE_SEPARATOR", xaxeSeparator],
	[TokenType.NAME, "NAME", xname],
	[TokenType.SPACE, 'SPACE', xspace, true],
	[TokenType.FUNCTION, 'FUNCTION'],
	[TokenType.ELEMENT, 'ELEMENT'],
	[TokenType.ATTRIBUTE, 'ATTRIBUTE'],
	[TokenType.VARIABLE, 'VARIABLE']
)
