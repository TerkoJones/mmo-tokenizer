import tester from "mmo-tester";
import { TokenizerState, extractors } from "../src";

const type = {
	SPACE: 0,
	NAME: 1,
	STRING: 2,
	NUMBER: 3,
	VEGETABLES: 4

}

export default () => {
	const test = tester("extractors");

	test('name-token', function () {
		const stName = "Manolo25";
		const stSpace = "\t\n";
		const stString = '"Esto es lo que hay"';
		const stNumber = "25.3"
		const str = stName + stSpace + stString + stNumber


		const state = new TokenizerState(str);
		const names = extractors.nameToken()
		const spaces = extractors.isoToken();
		const strings = extractors.quotedToken()
		const numbers = extractors.numberToken();

		this.equals(names.call(state, type.NAME), {
			type: type.NAME,
			value: stName
		})
		this.equals(spaces.call(state, type.SPACE), {
			type: type.SPACE,
			value: stSpace
		})
		this.equals(strings.call(state, type.STRING), {
			type: type.STRING,
			value: stString.substring(1, stString.length - 1)
		})
		this.equals(numbers.call(state, type.NUMBER), {
			type: type.NUMBER,
			value: stNumber
		})

	})

	test('match', function () {
		const st1 = "potatos";
		const st2 = "onions";
		const st3 = "CARROTS";
		const st4 = "tomatos"
		const st5 = "onions"
		const st6 = "carrots"
		const str = st1 + st2 + st3 + st4 + st5 + st6;
		const state = new TokenizerState(str);

		const vegetables = "potatos,onions,carrots,tomatos".split(',');
		const matchFromWord = extractors.match(st1)
		const matchFromList = extractors.match(vegetables)
		const matchFromListIC = extractors.match(vegetables, true)
		const matchIfListPrev = extractors.matchIf(vegetables, st3.toLowerCase(), { condLower: true, preceding: true })
		const matchIfList = extractors.matchIf(vegetables, st5)

		this.equals({
			type: type.VEGETABLES,
			value: st1
		}, matchFromWord.call(state, type.VEGETABLES), 'matchFromWord')
		this.equals({
			type: type.VEGETABLES,
			value: st2
		}, matchFromList.call(state, type.VEGETABLES), 'matchFromList')

		this.equals({
			type: type.VEGETABLES,
			value: st3
		}, matchFromListIC.call(state, type.VEGETABLES), 'matchFromListIC')

		this.equals({
			type: type.VEGETABLES,
			value: st4
		}, matchIfListPrev.call(state, type.VEGETABLES), 'matchIfListPrev')

		this.equals({
			type: type.VEGETABLES,
			value: st5
		}, matchIfList.call(state, type.VEGETABLES), 'matchIfList')



	})

}
