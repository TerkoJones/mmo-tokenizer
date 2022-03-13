export {
	nameToken,
	isoToken,
	quotedToken,
	numberToken,
	spaceToken
} from './basics'

export {
	match,
	matchIf
} from './match'

import { TokenExtractor, TokenAdapter } from './../types';
import { TokenizerState } from '../tokenizer-state';

export const adapter = (extractor: TokenExtractor, adapter: TokenAdapter): TokenExtractor => {
	return function (type: number) {
		let token = extractor.call(this, type);
		return token ? token : adapter.call(this, token!);
	}
}
