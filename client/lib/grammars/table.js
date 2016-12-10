"use strict";

var Step = require('./../model/step');
var CompositeGrammar = require('./composite-grammar');
var StepHolder = require('./../model/step-holder');
var changes = require('./../model/change-commands');
var Postal = require('postal');
var _ = require('lodash');
var Section = require('./../model/section');


class Table extends CompositeGrammar{
	constructor(metadata){
		super(metadata);
		var self = this;

		this.type = 'table';
		this.hasBeforeStep = metadata.hasBeforeStep;
		this.hasAfterStep = metadata.hasAfterStep;

		self.findActiveCells = function(step){
			var section = null;
			if (step instanceof Section){
				section = step;
			}
			else {
				section = step.parent;
			}

			// getting around garbage test data
			if (!section || !section.isCellActive){
				return self.cells;
			}

			return self.cells.filter(cell => {
				return section.isCellActive(cell.key);
			});
		}

		this.fixture = {
			find(key){
				return this;
			},

			buildStep(data){
				var step = new Step(data || {cells:{}}, self.cells, this);
				step.key = this.key + '-row';

				return step;
			},

			contextualControl(section, loader){
				var optionals = self.optionalCells(section);
				if (optionals.length == 0) return null;

				return loader.tableContext({table: self, section: section, optionals: optionals, title: 'Optional Columns'});
			},

			firstCell(step){
				var activeCells = self.findActiveCells(step);
				if (activeCells.length == 0) return null;

				return step.args.find(activeCells[0].key);
			},

			lastCell(step){
				var activeCells = self.findActiveCells(step);
				if (activeCells.length == 0) return null;

				var key = _.last(activeCells).key;
				return step.args.find(key);
			},

			nextCell(arg, step){
				var activeCells = self.findActiveCells(step);
				if (activeCells.length == 0) return null;

				if (arg == null) return this.firstCell(step);

				var cell = arg.cell.key;

				if (cell == _.last(activeCells).key) return null;

				var index = _.findIndex(activeCells, c => c.key == cell);
				if (index < 0) return null;

				return step.args.find(activeCells[index + 1].key);
			},

			previousCell(arg, step){
				if (arg == null) return this.lastCell(step);

				var cell = arg.cell.key;

				var activeCells = self.findActiveCells(step);
				if (activeCells.length == 0) return null;

				if (cell == activeCells[0].key) return null;

				var index = _.findIndex(activeCells, c => c.key == cell);
				if (index < 0) return null;

				return step.args.find(activeCells[index - 1].key);
			},

			addAndSelect(location){
				var newStep = self.addStep(location.holder);
				return newStep.selectFirst();
			},

			key: metadata.key,
			title: metadata.title
		}
		
		super(metadata);

		this.title = metadata.title;
		this.cells = metadata.cells;
		this.optionals = metadata.cells.filter(x => x.default != null && x.default != undefined)
			.map(x => {
				return {
					header: x.header || x.key,
					key: x.key
				}
			});

	}

	addStep(section) {
		var step = this.newRowStep();
		changes.stepAdded(section, step);

		return step;
	}

	toCloneRow (step, section){
		return () => {
			var newStep = this.newRowStep();

			this.cells.forEach(c => {
				var value = step.findValue(c.key);
				newStep.args.find(c.key).value = value;
			});

			changes.stepAdded(section, newStep);
		}
	}

	newRowStep(){
		return this.fixture.buildStep({cells: {}});
	}

	buildStep(data){
		var step = new Step({}, [], this);
		step.key = this.key;

		var children = this.readRawData(data);
		this.writeSection(step, children);

		return step;
	}

	newStep(){
		var step = this.buildStep({cells: {}});
		var section = this.readSection(step);


		return step;
	}

	editor(step, loader){
		var section = this.readSection(step);

		var cells = this.findActiveCells(section);
		
		var rows = section.steps.map(step => {
			var cloneRow = this.toCloneRow(step, section);

			return loader.row({cloneRow: cloneRow, step: step, cells: cells, section: section});
		});

		var section = this.readSection(step);
		
		var addStep = () => {
			this.addStep(section);
		}

		return loader.table({addStep: addStep, cells: cells, title: this.title, rows: rows, section: section, step: step, adder: section.adder});
	}

	buildResults(step, loader, isStepthrough, dispatch, spec){
		var section = this.readSection(step);
		var cells = this.findActiveCells(section);

		var rows = section.allErrors().map(error => {
			return loader.errorRow({width: cells.length, error: error});
		});

		section.steps.forEach(step => {
			var result = step.getResult();

			rows.push(loader.row({step: step, cells: cells, spec: spec, dispatch: dispatch, isStepthrough: isStepthrough, position: null})); 

			if (result.status == 'error'){
				rows.push(loader.errorRow({width: cells.length, error: result.error}));
			}
		});

		var table = null;

		if (isStepthrough){
			table = loader.stepthroughTable({cells: cells, title: this.title, rows: rows, section: section, isStepthrough: isStepthrough, hasBeforeStep: this.hasBeforeStep, hasAfterStep: this.hasAfterStep, spec: spec, dispatch: dispatch});
		}
		else {
			table = loader.table({cells: cells, title: this.title, rows: rows, section: section, isStepthrough: isStepthrough});
		}

		return table;
	}

	preview(step, loader){
		var section = this.readSection(step);
		var cells = this.findActiveCells(section);

		var rows = section.steps.map(step => {
			return loader.row({step: step, cells: cells}); 
		});

		return loader.table({cells: cells, title: this.title, rows: rows, section: section});
	}



	selectNext(location){
		return null;
	}

	selectPrevious(location){
		return null;
	}

	selectLast(step){
		var section = this.readSection(step);
		return {holder: section, step: section.adder, cell: null};
	}

	optionalCells(section){
		return this.optionals.map(x => {
			return {
				cell: x.key,
				header: x.header,
				active: section.isCellActive(x.key)
			};
		});
	}
}



module.exports = Table;