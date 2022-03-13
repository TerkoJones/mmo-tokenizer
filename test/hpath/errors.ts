

export const ERR = {
	UK_TOKEN: 'Token desconocido($)',
	UNX_TOKEN: 'Token inexperado($)',
	AXE_EXITS: 'Ya se ha indicado un eje($)',
	UK_AXE: 'No se conoce el eje $',
	NO_AXE: 'No se ha indicado un eje',
	EXP_TEST: 'Se esperaba stest',
	TEST_EXISTS: 'Ya se ha indicado un test de elemento($)',
	NO_TEST: 'No se ha indicado un test de elemeto',
	NO_CLASS: 'Se esperaba un nomber de clase',
	UNX_OPERATOR: 'Operador inexperado($)',
	NO_PREDICATE: 'Se experaba predicado',
	NO_PARSER: 'Se experaba conversor',
	EXPR_FAILED: 'La expresión es incorrecta',
	FUNC_UK: 'No se reconoce la función($)',
	FUNC_PARAM: 'Faltan parámetros para la functión($,$)',
	TWO_OPERATOR: 'Dos operadores consegutivos'

}

export const message = (err: string, ...args: any[]) => {
	if (args.length) {
		let ac = -1;
		err = err.replace(/\$/g, (m) => {
			ac++;
			if (ac < args.length) return args[ac].toString();
			return '#UK';
		})
	}
	return err;
}
