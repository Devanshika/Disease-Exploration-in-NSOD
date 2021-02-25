// index.js

/**
 * Required External Modules
 */

const express = require("express");
const path = require("path");
/**
 * App Variables
 */
const app = express();
const port = process.env.PORT || "8000";
/**
 *  App Configuration
 */
const fs = require("fs")
const rdfParser = require("rdf-parse").default;
const N3 = require('n3');
d3 = require("d3")

const store = new N3.Store();
const quadStream = rdfParser.parse(fs.createReadStream('C:\\Users\\devan\\Downloads\\output_file.ttl'),
    { contentType: 'text/turtle' });
store.import(quadStream)
    .on('end',
        () => {
            
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

            
            data = { "nodes": [], "links": [], "ontologylist" :ontologyList };
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
                if (subjectval.indexOf("http") >= 0 && objectval.indexOf("http") >= 0) {
                    link = { "source": subjectval, "target": objectval, "value": 1 };
                    data.links.push(link);
                }
            }
            
            /**
             * Routes Definitions
             */

            app.use(express.static(__dirname + '/Express'));
             
            app.get("/", (req, res) => {
                res.status(200).sendFile(path.join(__dirname+'/Express/index.html'));    
                      
            });
            app.post("/clicked", (req, res) => {
                return res.status(200).json({
                    ok: true,
                    data: data
                });
            });
            /**
             * Server Activation
             */
            app.listen(port, () => {
                console.log(`Listening to requests on http://localhost:${port}`);
            });
        });
