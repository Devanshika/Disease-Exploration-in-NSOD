///-------------------------------------------------------------------------------------------------
// File: app.js
//
// Author: Devanshika Ghosh
// Date: 02/19/2021
//
// Summary:	This file is the main program that calls the other functions for visualization
///-------------------------------------------------------------------------------------------------
const fs = require("fs")
const rdfParser = require("rdf-parse").default;
const N3 = require('n3');
const rdf = require('rdf-ext')
d3 = require("d3")
jsdom = require('jsdom');
http = require('http');
const store = new N3.Store();
const quadStream = rdfParser.parse(fs.createReadStream('C:\\Users\\devan\\Downloads\\output_file.ttl'),
    { contentType: 'text/turtle' });
store.import(quadStream)
    .on('end',
        () => {
            console.log('Stream has been imported');
            const allQuads = store.getQuads(null, null, null);
            ontologyList = [];
            for (i = 0; i < allQuads.length; i++) {
                subjectval = allQuads[i].subject.value;
                objectval = allQuads[i].object.value;
                if (subjectval.indexOf("http") >= 0) {
                    pos = subjectval.indexOf("#");
                    if (pos != -1) {
                        subjectval = subjectval.substring(0, pos);
                        subjectval = subjectval.match(/^https?:\/\/[^#?\/]+/)[0];
                        slash = subjectval.lastIndexOf('/');
                        subjectval = subjectval.substring(slash + 1);
                        if (ontologyList.indexOf(subjectval) < 0) {
                            ontologyList.push(subjectval);
                        }
                    }
                    else {
                        subjectval = subjectval.match(/^https?:\/\/[^#?\/]+/)[0];
                        slash = subjectval.lastIndexOf('/');
                        subjectval = subjectval.substring(slash + 1);
                        if (ontologyList.indexOf(subjectval) < 0) {
                            ontologyList.push(subjectval);
                        }
                    }
                }
                if (objectval.indexOf("http") >= 0) {
                    pos = objectval.indexOf("#");
                    if (pos != -1) {
                        objectval = objectval.substring(0, pos);
                        objectval = objectval.match(/^https?:\/\/[^#?\/]+/)[0];
                        slash = objectval.lastIndexOf('/');
                        objectval = objectval.substring(slash + 1);
                        if (ontologyList.indexOf(objectval) < 0) {
                            ontologyList.push(objectval);
                        }
                    }
                    else {
                        objectval = objectval.match(/^https?:\/\/[^#?\/]+/)[0];
                        slash = objectval.lastIndexOf('/');
                        objectval = objectval.substring(slash + 1);
                        if (ontologyList.indexOf(objectval) < 0) {
                            ontologyList.push(objectval);
                        }
                    }
                }
            }

            console.log(ontologyList);
            drag = simulation => {

                function dragstarted(event) {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                }

                function dragged(event) {
                    event.subject.fx = event.x;
                    event.subject.fy = event.y;
                }

                function dragended(event) {
                    if (!event.active) simulation.alphaTarget(0);
                    event.subject.fx = null;
                    event.subject.fy = null;
                }

                return d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended);
            }
            color = function(){
                const scale = d3.scaleOrdinal(d3.schemeCategory10);
                 return d => scale(d.group);
            }
            height = 600;
            width= 400;
            data = { "nodes": [], "links": [] };
            nodeList = [];
            for (i = 0; i < allQuads.length; i++) {
                subjectval = allQuads[i].subject.value;
                objectval = allQuads[i].object.value;
                if (subjectval.indexOf("http") >= 0) {
                    if (nodeList.indexOf(subjectval) < 0) {
                        nodeList.push(subjectval);
                        subject = subjectval.match(/^https?:\/\/[^#?\/]+/)[0];
                        slash = subject.lastIndexOf('/');
                        subject = subject.substring(slash + 1);
                        node = { "id": subjectval, "group": ontologyList.indexOf(subject) };
                        data.nodes.push(node);
                    }
                }
                if (objectval.indexOf("http") >= 0) {
                    if (nodeList.indexOf(objectval) < 0) {
                        nodeList.push(objectval);
                        object = objectval.match(/^https?:\/\/[^#?\/]+/)[0];
                        slash = object.lastIndexOf('/');
                        object = object.substring(slash + 1);
                        node = { "id": objectval, "group": ontologyList.indexOf(object) };
                        data.nodes.push(node);
                    }
                }
                if(subjectval.indexOf("http")>=0 && objectval.indexOf("http")>=0){
                    link={"source": subjectval, "target": objectval, "value" : 1};
                    data.links.push(link);
                }
            }
            chart = function(){
                const links = data.links.map(d => Object.create(d));
                const nodes = data.nodes.map(d => Object.create(d));
              
                const simulation = d3.forceSimulation(nodes)
                    .force("link", d3.forceLink(links).id(d => d.id))
                    .force("charge", d3.forceManyBody())
                    .force("center", d3.forceCenter(width / 2, height / 2));
              
                const svg = d3.create("svg")
                    .attr("viewBox", [0, 0, width, height]);
              
                const link = svg.append("g")
                    .attr("stroke", "#999")
                    .attr("stroke-opacity", 0.6)
                  .selectAll("line")
                  .data(links)
                  .join("line")
                    .attr("stroke-width", d => Math.sqrt(d.value));
              
                const node = svg.append("g")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5)
                  .selectAll("circle")
                  .data(nodes)
                  .join("circle")
                    .attr("r", 5)
                    .attr("fill", color())
                    .call(drag(simulation));
              
                node.append("title")
                    .text(d => d.id);
              
                simulation.on("tick", () => {
                  link
                      .attr("x1", d => d.source.x)
                      .attr("y1", d => d.source.y)
                      .attr("x2", d => d.target.x)
                      .attr("y2", d => d.target.y);
              
                  node
                      .attr("cx", d => d.x)
                      .attr("cy", d => d.y);
                });
              
                invalidation.then(() => simulation.stop());
              
                return svg.node().outerHTML;
              }
              http.createServer(
                function (req, res) {
                  // favicon - browser annoyance, ignore 
                  if(req.url.indexOf('favicon.ico') >= 0) {
                    res.statusCode = 404
                    return
                  }
              
                  res.writeHead(200, { "Content-Type": 'image/svg+xml' });
                  res.end(chart());
                }
              )
              .listen(8080, function() {
                console.log("Server listening on port 8080");
              });
        });



// stream=fs.createReadStream('C:\\Users\\devan\\Downloads\\output_file.ttl');
// const parser = new N3.Parser(({ format: 'Turtle' }));
// parser.parse(stream, console.log);

/*;(async function () {
// create a new dataset and import the quad stream into it (reverse pipe) with Promise API
const dataset = await rdf.dataset().import(quadStream)
console.log(`Dataset contains ${dataset.size} quads`)
console.log(dataset.toString());
})()
*/