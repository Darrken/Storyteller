var expect = require('chai').expect;
var SilentGrammar = require('./../lib/grammars/silent-grammar');
var StubLoader = require('./stub-loader');

describe('SilentGrammar', function(){
	var step = {
		getResult: function(position){
			if (position == '2'){
				return {status: 'error', error: 'bad!'}
			}

			return null;
		}
	}

	
	var loader = new StubLoader();

	it('returns an empty array when there is no result', function(){
		var grammar = new SilentGrammar({});
		grammar.position = '3';

		expect(grammar.buildResults(step, loader, false)).to.deep.equal([]);
	});

	it('builds an error box if there is an error result', function(){
		var grammar = new SilentGrammar({});
		grammar.position = '2';

		expect(grammar.buildResults(step, loader, false)[0]).to.deep.equal({
			type: 'errorBox',
			props: {
				title: 'Silent Action',
				error: 'bad!'
			}
		});
	});

});