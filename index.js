// index.js

/**
 * Required External Modules
 */

const express = require("express");
const path = require("path");
const bp = require('body-parser')
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

function getDataset(subjectVal, objectVal) {
    if (subjectVal.includes("dataset-")) {
        return subjectVal.substring(subjectVal.lastIndexOf("-") + 1);
    }
    else if (objectVal.includes("dataset-")) {
        return objectVal.substring(objectVal.lastIndexOf("-") + 1);
    }
    else {
        return "Linked Data";
    }
}


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
            joinednodes[subjectval] = { "id": subjectval, "relationships": [], "group": "", "dataset": "", "search": "" }
        }
        if (joinednodes[subjectval].dataset == "") {
            joinednodes[subjectval].dataset = getDataset(subjectval, objectval);
        }
        joinednodes[subjectval].relationships.push({ "Predicate": predicateval, "Object": objectval })
        subjedited = ""
        if (subjectval.includes("http")) {
            pos = subjectval.indexOf("#");
            if (pos >= 0) {
                if (subjectval.includes("dataset-")) {
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
        if (objectval.includes("http")) {
            objedited = ""
            if (!(objectval in joinednodes)) {
                joinednodes[objectval] = { "id": objectval, "relationships": [], "group": "", "dataset": "", "search": "" }
            }
            if (joinednodes[objectval].dataset == "") {
                joinednodes[objectval].dataset = getDataset(subjectval, objectval);
            }
            value = 45;
            if (objectval.includes("dataset-") || subjectval.includes("dataset-")) {
                value = 20;
            }
            links.push({ "source": subjectval, "target": objectval, "value": value });
            pos = objectval.indexOf("#");
            if (pos >= 0) {
                if (predicateval.includes("measure")) //measure
                {
                    measureVal = objectval.substring(pos + 1)
                    if (measureList.indexOf(measureVal) < 0) {
                        measureList.push(measureVal);
                    }
                }
                if (predicateval.includes("dimension") && subjectval.includes("dsd-disease")) //dimension
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
    datasetList.push("Linked Data")
    ontologyList.push("")
    data = {
        "nodes": [],
        "links": links,
        "ontologylist": ontologyList,
        "datasets": datasetList,
        "dimensions": null,
        "measures": measureList
    };
    uniqueDimensionValues = {}
    for (var key in dimensionList) {
        uniqueDimensionValues[dimensionList[key]] = []
    }
    for (var key in joinednodes) {
        data.nodes.push(joinednodes[key]);
        relationships = joinednodes[key].relationships;
        for (ix in relationships) {
            relationship = relationships[ix];
            if (relationship.Predicate.includes("dimension#")) {
                dimensionVal = relationship.Predicate.substring(relationship.Predicate.indexOf("#") + 1);
                value = relationship.Object.substring(relationship.Object.indexOf("#") + 1);
                if (value == relationship.Object) {
                    value = relationship.Object.substring(relationship.Object.lastIndexOf("/") + 1);
                }
                if (uniqueDimensionValues[dimensionVal].indexOf(value) < 0) {
                    uniqueDimensionValues[dimensionVal].push(value);
                }
            }
            // else if (relationship.Predicate.includes("code#")) {
            //     dimensionVal = relationship.Predicate.substring(relationship.Predicate.indexOf("#") + 1);
            //     if (dimensionVal in uniqueDimensionValues) {
            //         value = relationship.Object.substring(relationship.Object.indexOf("#") + 1);
            //         if (uniqueDimensionValues[dimensionVal].indexOf(value) < 0) {
            //             uniqueDimensionValues[dimensionVal].push(value);
            //         }
            //     }
            // }
            else if (relationship.Predicate.includes("statistical#")) {
                dimensionVal = relationship.Predicate.substring(relationship.Predicate.indexOf("#") + 1);
                if (dimensionVal in uniqueDimensionValues) {
                    value = relationship.Object.substring(relationship.Object.indexOf("#") + 1);
                    if (value == relationship.Object) {
                        value = relationship.Object.substring(relationship.Object.lastIndexOf("/") + 1);
                    }

                    if (uniqueDimensionValues[dimensionVal].indexOf(value) < 0) {
                        uniqueDimensionValues[dimensionVal].push(value);
                    }
                }
            }
        }
    }
    data.dimensions = uniqueDimensionValues;

    /**
     * Routes Definitions
     */

    app.use(express.static(__dirname + '/Express'));
    app.use(bp.json())
    app.use(bp.urlencoded({ extended: false }))
    // app.use(express.json())
    app.get("/", (req, res) => {
        res.status(200).sendFile(path.join(__dirname + '/Express/index.html'));

    });
    app.post("/getRDFData", (req, res) => {
        return res.status(200).json({
            ok: true,
            data: data
        });
    });
    app.post("/filterByDiseases", (req, res) => {
        return filterByDiseases(req, res, data);
    });
    app.post("/filterByYear", (req, res) => {
        return filterByYear(req, res, data);
    });
    app.post("/filterByArea", (req, res) => {
        return filterByArea(req, res, data);
    });
    app.post("/filterBySearch", (req, res) => {
        return filterBySearch(req, res, data);
    });

    function filterByDiseases(req, res, data) {
        disease = req.body.disease;
        data_copy = {
            "nodes": [],
            "links": [],
            "ontologylist": ontologyList,
            "datasets": datasetList,
            "dimensions": uniqueDimensionValues,
            "measures": measureList
        };
        node_object = {}
        all_nodes = data.nodes;
        for (ix in all_nodes) {
            node = all_nodes[ix];
            relationships = node.relationships;
            for (ix in relationships) {
                relationship = relationships[ix];
                if (relationship.Predicate.includes("#hasdisease")) {
                    value = relationship.Object.substring(relationship.Object.indexOf("#") + 1);
                    if (value == relationship.Object) {
                        value = relationship.Object.substring(relationship.Object.lastIndexOf("/") + 1);
                    }
                    if (disease == value) {
                        node_object[node.id] = node;
                        node_object[node.id].search = "Data";
                        break;
                    }
                }
            }
        }
        all_links = data.links;
        for (ix in all_links) {
            link = all_links[ix];
            if (!(link.source in node_object) && !(link.target in node_object)) {
                continue;
            }
            else if ((link.source in node_object) && !(link.target in node_object)) {
                node_object[link.target] = joinednodes[link.target];
                node_object[link.target].search = "Linked Data Sources";
            }
            else if (!(link.source in node_object) && (link.target in node_object)) {
                node_object[link.source] = joinednodes[link.source];
                node_object[link.source].search = "Linked Data Sources";
            }
            data_copy.links.push(link)
        }
        for (key in node_object) {
            data_copy.nodes.push(node_object[key]);
        }
        return res.status(200).json({
            ok: true,
            data: data_copy
        });
    }

    function filterByYear(req, res, data) {
        year = req.body.year;
        data_copy = {
            "nodes": [],
            "links": [],
            "ontologylist": ontologyList,
            "datasets": datasetList,
            "dimensions": uniqueDimensionValues,
            "measures": measureList
        };
        node_object = {}
        all_nodes = data.nodes;
        for (ix in all_nodes) {
            node = all_nodes[ix];
            relationships = node.relationships;
            for (ix in relationships) {
                relationship = relationships[ix];
                if (relationship.Predicate.includes("#refPeriod")) {
                    value = relationship.Object.substring(relationship.Object.indexOf("#") + 1);
                    if (value == relationship.Object) {
                        value = relationship.Object.substring(relationship.Object.lastIndexOf("/") + 1);
                    }
                    if (year == value) {
                        node_object[node.id] = node;
                        node_object[node.id].search = "Data";
                        break;
                    }
                }
            }
        }
        all_links = data.links;
        for (ix in all_links) {
            link = all_links[ix];
            if (!(link.source in node_object) && !(link.target in node_object)) {
                continue;
            }
            else if ((link.source in node_object) && !(link.target in node_object)) {
                node_object[link.target] = joinednodes[link.target];
                node_object[link.target].search = "Linked Data Sources";
            }
            else if (!(link.source in node_object) && (link.target in node_object)) {
                node_object[link.source] = joinednodes[link.source];
                node_object[link.source].search = "Linked Data Sources";
            }
            data_copy.links.push(link)
        }
        for (key in node_object) {
            data_copy.nodes.push(node_object[key]);
        }
        return res.status(200).json({
            ok: true,
            data: data_copy
        });
    }

    function filterByArea(req, res, data) {
        area = req.body.area;
        data_copy = {
            "nodes": [],
            "links": [],
            "ontologylist": ontologyList,
            "datasets": datasetList,
            "dimensions": uniqueDimensionValues,
            "measures": measureList
        };
        node_object = {}
        all_nodes = data.nodes;
        for (ix in all_nodes) {
            node = all_nodes[ix];
            relationships = node.relationships;
            for (ix in relationships) {
                relationship = relationships[ix];
                if (relationship.Predicate.includes("#refArea")) {
                    value = relationship.Object.substring(relationship.Object.indexOf("#") + 1);
                    if (value == relationship.Object) {
                        value = relationship.Object.substring(relationship.Object.lastIndexOf("/") + 1);
                    }
                    if (area == value) {
                        node_object[node.id] = node;
                        node_object[node.id].search = "Data";
                        break;
                    }
                }
            }
        }
        all_links = data.links;
        for (ix in all_links) {
            link = all_links[ix];
            if (!(link.source in node_object) && !(link.target in node_object)) {
                continue;
            }
            else if ((link.source in node_object) && !(link.target in node_object)) {
                node_object[link.target] = joinednodes[link.target];
                node_object[link.target].search = "Linked Data Sources";
            }
            else if (!(link.source in node_object) && (link.target in node_object)) {
                node_object[link.source] = joinednodes[link.source];
                node_object[link.source].search = "Linked Data Sources";
            }
            data_copy.links.push(link)
        }
        for (key in node_object) {
            data_copy.nodes.push(node_object[key]);
        }
        return res.status(200).json({
            ok: true,
            data: data_copy
        });
    }

    function filterBySearch(req, res, data) {
        search = req.body.search.toLowerCase();
        data_copy = {
            "nodes": [],
            "links": [],
            "ontologylist": ontologyList,
            "datasets": datasetList,
            "dimensions": uniqueDimensionValues,
            "measures": measureList
        };
        node_object = {}
        all_nodes = data.nodes;
        for (ix = 0; ix < all_nodes.length; ix++) {
            node = all_nodes[ix];
            if (node.id.toLowerCase().includes(search) ||
                node.dataset.toLowerCase().includes(search) ||
                node.group.toLowerCase().includes(search)) {
                node_object[node.id] = node;
                node_object[node.id].search = "Data";
            }
            else {
                relationships = node.relationships;
                for (jx in relationships) {
                    relationship = node.relationships[jx];
                    if (relationship.Object.toLowerCase().includes(search)) {
                        node_object[node.id] = node;
                        node_object[node.id].search = "Data";
                    }
                }
            }
        }
        all_links = data.links
        for (ix in all_links) {
            link = all_links[ix];
            if (!(link.source in node_object) && !(link.target in node_object)) {
                continue;
            }
            else if ((link.source in node_object) && !(link.target in node_object)) {
                node_object[link.target] = joinednodes[link.target];
                node_object[link.target].search = "Linked Data Sources";
            }
            else if (!(link.source in node_object) && (link.target in node_object)) {
                node_object[link.source] = joinednodes[link.source];
                node_object[link.source].search = "Linked Data Sources";
            }
            data_copy.links.push(link)
        }
        for (key in node_object) {
            data_copy.nodes.push(node_object[key]);
        }
        return res.status(200).json({
            ok: true,
            data: data_copy
        });
    }
    /**
     * Server Activation
     */
    app.listen(port, () => {
        console.log(`Listening to requests on http://localhost:${port}`);
    });
}

quadStream = rdfParser.parse(fs.createReadStream(__dirname + '/updated_file.ttl'), { contentType: 'text/turtle' });
store.import(quadStream).on('end', launch_application);