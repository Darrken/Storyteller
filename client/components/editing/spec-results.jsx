var React = require('react');
var Postal = require('postal');
var {connect} = require('react-redux');
var {Button, ButtonGroup, Grid, Row, Col, ListGroup, ListGroupItem} = require('react-bootstrap');
var EditorLoading = require('./alerts/editor-loading');
var SpecHeader = require('./header/spec-header');
var SpecResultHeader = require('./header/spec-result-header');
var loader = require('./component-loader').results;
var Persisting = require('./alerts/persisting');


function getSpec(state, ownProps){
    var id = ownProps.params.id;
    var spec = state.get('specs').get(id);
    
    var loading = spec.mode == 'header';
    
    var running = state.get('running') === id;
    if (running){
        return {spec: spec, loading: loading, running: running};
    }
    else if (spec.last_result){
        return {spec: spec, loading: false, running: false}
    }
    
    

    if (loading){
        // TODO -- do this differently
        Postal.publish({
            channel: 'engine-request',
            topic: 'spec-data-requested',
            data: {
                type: 'spec-data-requested',
                id: id
            }
        });
    }

    
    return {spec: spec, loading: loading, running: running};
}

function addDispatch(dispatch){
    return {dispatch: dispatch};
}

function SpecResults(props){
    if (props.loading){
        return ( <EditorLoading spec={props.spec} /> );
    }

    loader.reset();
    var components = props.spec.buildResults(loader, props.running);
    
    return (
        <Grid>
            <SpecHeader spec={props.spec} mode='results' />
            <Row>
                <SpecResultHeader spec={props.spec} />
                <Persisting id={props.spec.id}/>
                {components}
            </Row>
        </Grid>
    );
}



module.exports = connect(getSpec, addDispatch)(SpecResults);