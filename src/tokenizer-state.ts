import { Token } from "./types";



export class TokenizerState {
	public linestart: number = 0;
	public canceled: boolean = false;
	public error: string = '';

	private _txt_: string;
	private _line_: number = 0;
	private _pos_: number = 0;				// próxima posición a analizar
	private _pps_ = 0;								// Posición de extracción.
	private _stack_: Token[] = [];
	private _nest_: Token[][] = [this._stack_];


	constructor(text: string) {
		this._txt_ = text;
	}

	public get text() {
		return this._txt_;
	}


	public lineExtract(to?: number | string) {
		to = to === undefined ? '\n' : to;
		let last = this._pos_;
		if (typeof to === 'string') {
			last = this.text.indexOf(to, last);
		} else if (typeof to === 'number') {
			last += to;
		} else {
			throw new TypeError("Expected string, number or nothing(='\n')");
		}
		return this.text.substring(this.linePosition, last);
	}

	public get lineNumber(): number {
		return this._line_;
	}

	public get linePosition() {
		return this._pos_ - this.linestart;
	}

	/** Indica que queda texto por analizar */
	public get ok() {
		return this._pos_ < this._txt_.length;
	}


	public get consumed() {
		return this._pos_ - this._pps_;
	}

	public get pending() {
		return this._stack_.length;
	}

	public get nestingLevel() {
		return this._nest_.length;
	}

	public last() {
		return this._stack_.at(-1)!;
	}

	public push(token: Token) {
		this._stack_.push(token);
	}

	public pop() {
		return this._stack_.pop()!;
	}

	public levelUp() {
		this._nest_.push(this._stack_);
		this._stack_ = [];
	}

	public levelDown() {
		if (!this._nest_.length) throw new Error("State error: Nesting levels overflow");
		if (this._stack_.length) throw new Error("State error: Pending tokens in stack");
		this._stack_ = this._nest_.pop()!;
	}

	public next(num = 1) {
		this._pos_ += num;
		return this._pos_ < this._txt_.length;
	}


	/**
	 * Ignora las posiciones inidadas y establece un nuevo
	 * punto de extracción.
	 * sólo ha de llamarse tras tomar un token
	 * */
	public ignoreNext(num: number = 1) {
		this._pos_ += num;
		this._pps_ = this._pos_;
	}

	/**
	 * reestablece las posición inicial de extracción
	 * la útima extraccioón.
	 */
	public restorePointer() {
		this._pos_ = this._pps_;
	}


	public codePoint() {
		return this._txt_.codePointAt(this._pos_)!;
	}

	public char() {
		return this._txt_[this._pos_];
	}
	public charAt(rel: number) {
		return this._txt_[this._pos_ + rel];
	}

	public codePointAt(rel: number) {
		return this._txt_.charCodeAt(this._pos_ + rel);
	}

	/**
	 * Check Functions:
	 *
	 * Asumen que el valor del token y del puntero son válidos. Por tanto
	 * el puntero(pos) apunta al caracter inmediato al token contendio.
	 * Partiendo de esto, los 'following' chequean desde la posición
	 * apuntada(pos); y los preceding desde la posición anterior al primer
	 * caracter del token contenido.
	 *
	 */
	public checkFollowing(str: string): boolean {
		return this._txt_.substring(this._pos_, this._pos_ + str.length) === str;
	}

	public checkFollowingToLowerCase(str: string): boolean {
		return this._txt_.substring(this._pos_, this._pos_ + str.length).toLowerCase() === str;
	}

	public checkFollowingInList(list: string[]): number {
		return this._search_(list, this.checkFollowing);
	}

	public checkFollowingInListToLowerCase(list: string[]): number {
		return this._search_(list, this.checkFollowingToLowerCase);
	}

	public checkPreceding(str: string): boolean {
		return this._txt_.substring(this._pos_ - str.length, this._pos_) === str;
	}

	public checkPrecedingToLowerCase(str: string): boolean {
		return this._txt_.substring(this._pos_ - str.length, this._pos_).toLowerCase() === str;
	}

	public checkPrecedingInList(list: string[]): number {
		return this._search_(list, this.checkPreceding);
	}

	public checkPrecedingInListToLowerCase(list: string[]): number {
		return this._search_(list, this.checkPrecedingToLowerCase);
	}


	public newLine() {
		this._line_++;
		this.linestart = this._pos_;
	}

	/**
	 * Extrae un token desde la posición previa hasta la actual.
	 * @param type tipo del token
	 * @param ignore caracteres que se ignoran desde la posición previa
	 * @param include caracteres que se incluyen tras la posición actual
	 * @returns token extraido
	 */
	public getToken(ignore: number = 0, include = 0) {
		if (ignore < 0) ignore = this.consumed;
		const ret = this._txt_.substring(this._pps_ + ignore, this._pos_ + include)
		this._pos_ += include;
		this._pps_ = this._pos_;
		return ret;
	}

	private _search_(list: string[], check: (str: string) => boolean) {
		for (let i = 0; i < list.length; i++) {
			if (check.call(this, list[i])) return i;//:)>
		}
		return -1;
	}
}
