import { TokenType, info } from "./hpath-tokenizer";
import { Token, TokenizerState } from "../../src";
import { message, ERR } from "./errors";


export interface HPathStep {
	axe: string,
	test: string, // name or wildcard
	classes?: string[];
	predicate: string,
	parser: string
}
const createStep = (): HPathStep => ({
	axe: '',
	test: '',
	predicate: '',
	parser: ''
});


export const phase = {
	AXE: 0,
	NAME: 1,
	CLASSES: 2,
	PREDICATE: 3,
	PARSER: 4
}

export class HPathState extends TokenizerState {


	public absolut: boolean = false;

	public phase = 0;
	public steps: HPathStep[];
	public nesting = 0;
	private _step: HPathStep;


	constructor(str: string) {
		super(str);
		this.steps = [];
		this._step = createStep();
	}


	public get test() { return this._step.test };
	public set test(val: string) { this._step.test = val };
	public get axe() { return this._step.axe };
	public set axe(val: string) { this._step.axe = val; }
	public get classes(): string[] | undefined { return this._step.classes };
	public get predicate() { return this._step.predicate };
	public set predicate(val: string) { this._step.predicate = val; }
	public get parser() { return this._step.parser };
	public set parser(val: string) { this._step.parser = val; }

	public setAxe(token: Token): boolean {
		if (this.axe) {
			this.error = message(ERR.AXE_EXITS, this.axe);
			return false;
		}
		if (this.test) {
			this.error = message(ERR.UNX_TOKEN, token.value);
			return false;
		}
		if (!info.axeNameSet.has(token.value)) {
			this.error = message(ERR.UK_AXE);
			return false;
		}
		this._step.axe = token.value;
		return true;
	}


	public setTest(token: Token): boolean {
		if (this.test) {
			this.error = message(ERR.TEST_EXISTS, this.test);
			return false;
		}
		if (this.predicate || this.parser) {
			this.error = message(ERR.UNX_TOKEN, token.value);
			return false;
		}
		this._step.test = token.value;
		return true;
	}

	public addClass(token: Token) {
		this._step.classes ||= [];
		this._step.classes.push(token.value);
	}



	/** True si recupera un nombre de la pila y lo asigna como test o como clase. */
	public recoverTest() {
		if (this.pending) {
			if (this.test) {
				this.addClass(this.pop());
			} else {
				this.setTest(this.pop())
			}
			return true;
		}
		return false;
	}



	/** True si no hay pendientes */
	public ensureNoPendings(current: Token) {
		if (this.pending > 0) {
			this.error = message(ERR.UNX_TOKEN, current.value);
			return false;
		}
		return true;
	}

	/** True si al pendientes */
	public ensurePendings(token: Token) {
		if (this.pending === 0) {
			this.error = message(ERR.UNX_TOKEN, token.value);
			return false;
		}
		return true;
	}

	/** True si hay test o ha recuperado uno de la pila */
	public ensureTestFor(token: Token) {
		this.recoverTest();
		if (!this.test) {
			this.error = message(ERR.UNX_TOKEN, token.value);
			return false;
		}
		return true;
	}


	public addStep() {
		//Comprobaciones
		if (this.pending) throw new Error("Algo no marcha");
		this.steps.push(this._step);
		this.phase = phase.AXE;
		this._step = createStep();
		if (this.phase === phase.PREDICATE) this.error = message(ERR.NO_PREDICATE);
	}






}
