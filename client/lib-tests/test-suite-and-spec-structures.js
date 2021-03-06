var expect = require('chai').expect;

var Spec = require('./../lib/model/specification');
var Suite = require('./../lib/model/suite');
var _ = require('lodash');

describe('Spec', function(){
	describe('Initial Object', function(){
		var spec = new Spec({title: 'Foo', id: '123', lifecycle: 'Acceptance'}, {});

		it('grabs name', function(){
			expect(spec.title).to.equal('Foo');
		});

		it('grabs id', function(){
			expect(spec.id).to.equal('123');
		});

		it('grabs lifecycle', function(){
			expect(spec.lifecycle).to.equal('Acceptance');
		});


	});

	it('uses acceptance as the default lifecycle', function(){
		var newSpec = new Spec({name: 'foo', id: 1});

		expect(newSpec.lifecycle).to.equal('Acceptance');
	});
});

describe('Suite', function(){
	var data = {
		name: 'Top',
		path: '',
		suites: [
			{
				name: 'Sentences',
				path: 'Sentences',
				suites: [
					{name: 'Facts', path: 'Sentences/Facts', specs: ['1', '2']}


				],
				specs: [
					'3', '4'
				]
			},
			{
				name: 'Tables',
				path: 'Tables',
				specs: ['5', '6']
			}


		]

	}

	var suite = new Suite(data);


	it('can tell you if it has a spec positive', () => {
		expect(suite.suites[0].suites[0].hasSpec('1')).to.be.true;
	});

	it('can tell you if it has a spec negative', () => {
		expect(suite.hasSpec('non existent')).to.be.false;
	});

	// was a bug where Suite was double dipping its spec summary
	it('can summarize for a single suite', function(){
		var child = suite.childSuite('Sentences');
        var specs = {
            1: {lifecycle: 'Acceptance', status: 'none'}, 
            2: {lifecycle: 'Acceptance', status: 'none'}, 
            3: {lifecycle: 'Acceptance', status: 'none'}, 
            4: {lifecycle: 'Acceptance', status: 'none'}, 
            5: {lifecycle: 'Acceptance', status: 'none'}, 
            6: {lifecycle: 'Acceptance', status: 'none'}
        }
        
        var specDict = new require('immutable').Map(specs);
        

		var summary = child.summary(specDict);

		expect(summary).to.deep.equal({
			acceptance: 4,
			failed: 0,
			none: 4,
			regression: 0,
			success: 0,
			total: 4
		});
	});

	it('can get the id list of all the underlying specs', function(){
		expect(suite.allSpecs()).to.deep.equal(['3', '4', '1', '2', '5', '6']);
	});

	it('gets the name and path', function(){
		expect(suite.name).to.equal('Top');
		expect(suite.path).to.equal('');
	});

	it('builds child suites', function(){
		expect(suite.suites[0].name).to.equal('Sentences');
		expect(suite.suites[1].name).to.equal('Tables');
	});

	it('sets the parent on immediate child suites', function(){
		expect(suite.suites[0].parent).to.equal(suite);
		expect(suite.suites[1].parent).to.equal(suite);
	});

});

var reducer = require('./../lib/state/reducer');
var { createStore } = require('redux');
var initial = require('./../initialization');
var Counts = require('./../lib/model/counts');

describe('When calculating the icon for suite status', () => {
   var store, top;
   
   beforeEach(() => {
       store = createStore(reducer);
       store.dispatch(initial);
       
       top = store.getState().get('hierarchy');
   });
   
   it('is none with no results, running, or queued', () => {
      expect(top instanceof Suite).to.be.true;
       
      var suite = top.childSuite('Embedded');
      var specs = store.getState().get('specs');
      
      expect(suite.icon(specs, null, [], {})).to.equal('none');
   });
   
   it('is running if any spec is running', () => {
      var suite = top.childSuite('Embedded');

      var specs = store.getState().get('specs');
      
      expect(suite.icon(specs, {id:'embeds', status: 'none'}, [], {counts: new Counts(0, 0, 0, 0)})).to.equal('running');
   });
   
   it('is running-success if any spec is running successfully', () => {
      var suite = top.childSuite('Embedded');

      var specs = store.getState().get('specs');
      
      expect(suite.icon(specs, {id:'embeds', status: 'success'}, [], {counts: new Counts(1, 0, 0, 0)})).to.equal('running-success');
   });
   
   
   it('is running-failed if any spec is running and failing', () => {
      var suite = top.childSuite('Embedded');

      var specs = store.getState().get('specs');
      
      expect(suite.icon(specs, {id:'embeds', status: 'failed'}, [], {counts: new Counts(1, 1, 0, 0)})).to.equal('running-failed');
   });
   
   it('is failed if any spec has failed', () => {
       store.dispatch({
           type: 'spec-execution-completed', 
           id: 'embeds', 
           results: {
               counts: {rights: 1, wrongs: 1, errors: 1, invalids: 0}
           }
       });
   
       var suite = top.childSuite('Embedded');
       var specs = store.getState().get('specs');
      
       expect(suite.icon(specs, null, [], {})).to.equal('failed');
   });
   
   it('is success if any spec has succeeded with no failures', () => {
       store.dispatch({
           type: 'spec-execution-completed', 
           id: 'embeds', 
           results: {
               counts: {rights: 1, wrongs: 0, errors: 0, invalids: 0}
           }
       });
   
        
   
       var suite = top.childSuite('Embedded');
       var specs = store.getState().get('specs');
       
       expect(specs.get('embeds').status).to.equal('success');
      
       expect(suite.icon(specs, null, [], {})).to.equal('success');
   });
});

