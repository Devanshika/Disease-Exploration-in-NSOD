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
const store = new N3.Store();

launch_application = function () {
    allQuads = store.getQuads(null, null, null);
    ontologyList = [];
    joinednodes = {}
    links = []
    dimensionList = []
    measureList = []
    datasetList = []
    for (i = 0; i < allQuads.length; i++) {
        subjectval = allQuads[i].subject.value;
        objectval = allQuads[i].object.value;
        predicateval = allQuads[i].predicate.value;
        if (!(subjectval in joinednodes)) {
            joinednodes[subjectval] = { "id": subjectval, "relationships": [], "group": "" }
        }
        joinednodes[subjectval].relationships.push({ "Predicate": predicateval, "Object": objectval })
        subjedited = ""
        if (subjectval.indexOf("http") >= 0) {
            pos = subjectval.indexOf("#");
            if (pos >= 0) {
                if (subjectval.indexOf("dataset-") >= 0) {
                    datasetName = subjectval.substring(subjectval.lastIndexOf("-") + 1)
                    if (datasetList.indexOf(datasetName) < 0) {
                        datasetList.push(datasetName);
                    }
                }
                subjedited = subjectval.substring(0, pos);
                subjedited = subjedited.match(/^https?:\/\/[^#?\/]+/)[0];
                slash = subjedited.lastIndexOf('/');
                subjedited = subjedited.substring(slash + 1);
                if (ontologyList.indexOf(subjedited) < 0) {
                    ontologyList.push(subjedited);
                }
            }
            else {
                subjedited = subjectval.match(/^https?:\/\/[^#?\/]+/)[0];
                slash = subjedited.lastIndexOf('/');
                subjedited = subjedited.substring(slash + 1);
                if (ontologyList.indexOf(subjedited) < 0) {
                    ontologyList.push(subjedited);
                }
            }
        }
        joinednodes[subjectval].group = subjedited;
        if (objectval.indexOf("http") >= 0) {
            objedited = ""
            if (!(objectval in joinednodes)) {
                joinednodes[objectval] = { "id": objectval, "relationships": [], "group": "" }
            }
            joinednodes[objectval].relationships.push({ "Predicate": predicateval, "Subject": subjectval })
            links.push({ "source": subjectval, "target": objectval, "value": 1 });
            pos = objectval.indexOf("#");
            if (pos >= 0) {
                if (predicateval.indexOf("measure") >= 0) //measure
                {
                    measureVal = objectval.substring(pos + 1)
                    if (measureList.indexOf(measureVal) < 0) {
                        measureList.push(measureVal);
                    }
                }
                if (predicateval.indexOf("dimension") >= 0) //dimension
                {
                    dimensionVal = objectval.substring(pos + 1)
                    if (dimensionList.indexOf(dimensionVal) < 0) {
                        dimensionList.push(dimensionVal);
                    }
                }
                objedited = objectval.substring(0, pos);
                objedited = objedited.match(/^https?:\/\/[^#?\/]+/)[0];
                slash = objedited.lastIndexOf('/');
                objedited = objedited.substring(slash + 1);
                if (ontologyList.indexOf(objedited) < 0) {
                    ontologyList.push(objedited);
                }
            }
            else {
                objedited = objectval.match(/^https?:\/\/[^#?\/]+/)[0];
                slash = objedited.lastIndexOf('/');
                objedited = objedited.substring(slash + 1);
                if (ontologyList.indexOf(objedited) < 0) {
                    ontologyList.push(objedited);
                }
            }
            joinednodes[objectval].group = objedited;
        }
    }

    ontologyList.push("")
    data = { "nodes": [], "links": links, "ontologylist": ontologyList, "datasets": datasetList, "dimensions": dimensionList, "measures": measureList };
    for (var key in joinednodes) {
        data.nodes.push(joinednodes[key]);
    }

    /**
     * Routes Definitions
     */

    app.use(express.static(__dirname + '/Express'));

    app.get("/", (req, res) => {
        res.status(200).sendFile(path.join(__dirname + '/Express/index.html'));

    });
    app.post("/getRDFData", (req, res) => {
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
}

quadStream = rdfParser.parse(fs.createReadStream(__dirname + '/output_file.ttl'), { contentType: 'text/turtle' });
store.import(quadStream).on('end', launch_application);