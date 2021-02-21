///-------------------------------------------------------------------------------------------------
// File: app.js
//
// Author: Devanshika Ghosh
// Date: 02/19/2021
//
// Summary:	This file is the main program that calls the other functions for visualization
///-------------------------------------------------------------------------------------------------
const fs=require("fs")
const rdfParser = require("rdf-parse").default;
const N3 = require('n3');
const store = new N3.Store();
const quadStream = rdfParser.parse(fs.createReadStream('C:\\Users\\devan\\Downloads\\output_file.ttl'),
  { contentType: 'text/turtle' });

store.import(quadStream)
  .on('end', () => console.log('Stream has been imported'));