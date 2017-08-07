'use strict';

const sax = require('sax');
const fs = require('fs');
const express = require('express')
const app = express()
const fileUpload = require('express-fileupload');
const stream = require('stream');
const mustacheExpress = require('mustache-express');

let dot = 'digraph G { ';
let state;


const handleErrorParse =  e => {
  console.error("error!", e)
};

const handleStartTag = node => {
  if (node.name === 'state') {
 	const { name } = node.attributes;
	state = name;
	dot = dot + ' ' + name + ' [shape=box,style=filled,color="palegreen2"]; ';
  } else if (node.name === 'state-transition') {
 	const { name, to } = node.attributes;
    dot = dot + ' edge [color=gray]; ';
  	dot = dot + state + ' -> ' + to + ' [label=' + name + ']; ';
  }
};

const endParseHandler = (req, res) => e => {
	dot = dot + '}';
	// res.status(200).send(dot);
	res.render('graph.html', { dotString: dot });
}

const handleUpload = (req, res) => {
	if (!req.files || !req.files.xml) {
		return res.status(400).send('No XML files were upload');
	}

	dot = 'digraph G { ';
	state = '';

	const handleEndParse = endParseHandler(req, res);

	const saxStream = sax.createStream(true)
	saxStream.on("error", handleErrorParse);
	saxStream.on("opentag", handleStartTag);
	saxStream.on('end', handleEndParse);

	const dataStream = new stream.PassThrough();
	dataStream.end(req.files.xml.data);
	dataStream.pipe(saxStream);
}


app.use(express.static('public'));
app.use(fileUpload());
app.engine('html', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.post('/render', handleUpload);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`UFS Workflow Viz app listening on port ${PORT}!`);
  console.log('Press Ctrl+C to quit.');
})
