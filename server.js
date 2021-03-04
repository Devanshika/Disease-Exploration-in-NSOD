/**
 * Required External Modules
 */

const express = require("express");
const path = require("path");
const bp = require('body-parser')
const fs = require("fs")
const rdfParser = require("rdf-parse").default;
const N3 = require('n3');
const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;
const storeStream = require('rdf-store-stream').storeStream;
const request = require('request');
const streamer = require('streamify-string');
const config = require('./config.json');
const { Console } = require("console");
/**
 * App Variables
 */
const app = express();
const port = process.env.PORT || "8000";
/**
 *  App Configuration
 */

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


function getDefaultNodeStructure(value) {
    return { "id": value, "relationships": [], "group": "", "dataset": "Linked Data", "search": "", "url": "" };
}

function downloadPage(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
        });
    });
}

async function getDiseaseInfo(value) {
    try {
        rdf_xml = await downloadPage(value)
        quadStream = rdfParser.parse(streamer(rdf_xml), { contentType: 'application/rdf+xml' });
        store = await storeStream(quadStream);
        definitionQuad = store.getQuads(namedNode(value),
            namedNode('http://purl.obolibrary.org/obo/IAO_0000115'), null)
        labelQuad = store.getQuads(namedNode(value),
            namedNode('http://www.w3.org/2000/01/rdf-schema#label'), null)
        disease = {
            "name": labelQuad[0].object.value,
            "definition": definitionQuad[0].object.value
        }
    }
    catch (e) {
        console.log(e);
        console.log("For: " + value)
        disease = {
            "name": value,
            "definition": value
        }
    }
    return disease
}

async function getRelationship(predicate, object, parsedDiseaseInfo) {
    relationship = { "predicate": "", "object": "" }
    if (predicate.includes("#label")) {
        relationship.predicate = "Label"
        relationship.object = object
    }
    else if (predicate.includes("#comment")) {
        relationship.predicate = "Description"
        relationship.object = object
    }
    else if (predicate.includes("#isDefinedBy")) {
        relationship.predicate = "More Info"
        relationship.object = object
    }
    else if (predicate.includes("#numberofcases")) {
        relationship.predicate = "dimension#numberofcases"
        relationship.object = object
    }
    else if (predicate.includes("#rateper100kpopulation")) {
        relationship.predicate = "dimension#rateper100kpopulation"
        relationship.object = object
    }
    // else if (predicate.includes("#sex")) {
    //     relationship.predicate = "dimension#sex"
    //     relationship.object = getObjectValue(object)
    // }
    else if (predicate.includes("#refPeriod")) {
        relationship.predicate = "dimension#refPeriod"
        relationship.object = getObjectValue(object)
    }
    else if (predicate.includes("#department")) {
        relationship.predicate = "Department"
        relationship.object = getObjectValue(object)
    }
    else if (predicate.includes("#keyword")) {
        relationship.predicate = "Keyword"
        relationship.object = getObjectValue(object)
    }
    else if (predicate.includes("#refArea")) {
        relationship.predicate = "dimension#refArea"
        relationship.object = getObjectValue(object)
    }
    else if (predicate.includes("#hasdisease")) {
        if (!(object in parsedDiseaseInfo)) {
            diseaseInfo = getDiseaseInfo(object)
            parsedDiseaseInfo[object] = diseaseInfo
        }
        relationship.predicate = "Disease"
        relationship.object = parsedDiseaseInfo[object].name
    }
    else {
        relationship = null
    }
    return relationship;
}

function getObjectValue(object) {
    hashPos = object.indexOf("#");
    if (hashPos == -1) {
        hashPos = object.lastIndexOf("/");
    }
    return object.substring(hashPos + 1);
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function correctOntologyLink(value) {
    if (value.includes("/obo/doid/")) {
        if (isNumeric(value.substring(value.lastIndexOf("/") + 1))) {
            value = value.replace("doid/", "DOID_")
        }
    }
    return value;
}

// function filterByDiseases(req, res, data, joinedNodes) {
//     disease = req.body.disease; //get disease from request
//     data_copy = { //create a copy
//         "nodes": [],
//         "links": [],
//         "ontologylist": data.ontologyList,
//         "datasets": data.datasets,
//         "dimensions": data.dimensions,
//         "measures": data.measures
//     };

//     node_object = {}
//     all_nodes = data.nodes;

//     for (ix in all_nodes) {//loop through nodes to find disease nodes
//         node = all_nodes[ix];
//         diseaseNode = node.id.includes("DOID_")
//         relationships = node.relationships;
//         for (ix in relationships) {
//             relationship = relationships[ix];
//             if (diseaseNode) {
//                 if (relationship.predicate.includes("Label")) {
//                     if (disease == relationship.object) {
//                         node_object[node.id] = node;
//                         node_object[node.id].search = "Data";
//                         break;
//                     }
//                 }
//             }
//             else if (relationship.predicate.includes("Disease")) {
//                 if (disease == relationship.object) {
//                     node_object[node.id] = node;
//                     node_object[node.id].search = "Data";
//                     break;
//                 }
//             }
//         }
//     }
//     all_links = data.links;
//     get_linked_data(node_object, all_links, data_copy, joinedNodes)
//     return res.status(200).json({
//         ok: true,
//         data: data_copy
//     });
// }

function filterData(req, res, data, joinedNodes) {
    if (req.body.year != "All Years") {
        data = filterByDimension(req.body.year, "refPeriod", data, joinedNodes)
    }
    if (req.body.area != "All Areas") {
        data = filterByDimension(req.body.area, "refArea", data, joinedNodes)
    }
    search = req.body.search.toLowerCase();
    if (search != "") {
        data_copy = { //create a copy
            "nodes": [],
            "links": [],
            "ontologylist": data.ontologyList,
            "datasets": data.datasets,
            "dimensions": data.dimensions,
            "measures": data.measures
        }
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
                    if (relationship.object.toLowerCase().includes(search)) {
                        node_object[node.id] = node;
                        node_object[node.id].search = "Data";
                    }
                }
            }
        }
        all_links = data.links
        get_linked_data(node_object, all_links, data_copy, joinedNodes)
        data = data_copy
    }
    return res.status(200).json({
        ok: true,
        data: data
    });

}

function get_linked_data(node_object, all_links, data_copy, joinedNodes) {
    temp_node_object = {} //add linked nodes
    for (ix in all_links) { //loop through links to find if target or source node node in node_object
        link = all_links[ix];
        if (!(link.source in node_object) && !(link.target in node_object)) {
            continue;
        }
        else if ((link.source in node_object) && !(link.target in node_object)) {
            temp_node_object[link.target] = joinedNodes[link.target];
            temp_node_object[link.target].search = "Linked Data Sources";
        }
        else if (!(link.source in node_object) && (link.target in node_object)) {
            temp_node_object[link.source] = joinedNodes[link.source];
            temp_node_object[link.source].search = "Linked Data Sources";
        }
        data_copy.links.push(link)
    }
    node_object = { ...node_object, ...temp_node_object }; //append linked nodes to searched nodes
    for (key in node_object) { //push nodes in data object
        data_copy.nodes.push(node_object[key]);
    }
}
function getByDataset(req, res, data) {
    if (!req.body.showLinkedDataToggle) {
        data_copy = { //create a copy
            "nodes": [],
            "links": [],
            "ontologylist": data.ontologyList,
            "datasets": data.datasets,
            "dimensions": data.dimensions,
            "measures": data.measures
        }
        node_object = {}
        all_nodes = data.nodes;
        for (ix = 0; ix < all_nodes.length; ix++) {
            node = all_nodes[ix];
            if (!node.dataset.includes("Linked Data")) {
                node_object[node.id] = node;
            }
        }
        all_links = data.links
        for (ix in all_links) { //loop through links to find if target or source node node in node_object
            link = all_links[ix];
            if (!(link.source in node_object) || !(link.target in node_object)) {
                continue;
            }
            data_copy.links.push(link)
        }
        for (key in node_object) { //push nodes in data object
            data_copy.nodes.push(node_object[key]);
        }
        data = data_copy;
    }
    return res.status(200).json({
        ok: true,
        data: data
    });
}

function getChartData(req, res, data) {
    front_data = []
    nodes = data.nodes
    for (ix in nodes) {
        node = nodes[ix]
        if (node.id.includes("obs-")) {
            observation = { "id": node.id, "refArea": "All Areas", "refPeriod": "All Years", "numberOfCases": 0, "rateper100kpopulation": 0, "dataset": node.dataset }
            relationships = node.relationships
            for (jx in relationships) {
                relationship = relationships[jx]
                if (relationship.predicate in observation) {
                    observation[relationship.predicate] = relationship.object
                }
            }
            front_data.push(observation)
        }
    }
    return res.status(200).json({
        ok: true,
        data: front_data
    });
}

async function launchApplication() {
    //parse the turtle file into a stream of quads
    quadStream = rdfParser.parse(fs.createReadStream(__dirname + config.dataFile), { contentType: 'text/turtle' });
    //store the stream of quads to get access to data quickly
    store = await storeStream(quadStream);
    //get all quads to be converted to JSON later
    allQuads = store.getQuads(null, null, null);

    //create variables that will be sent to the frontend
    ontologyList = [];
    joinedNodes = {}
    links = []
    dimensionList = []
    measureList = []
    datasetList = []
    parsedDiseaseInfo = {}
    datasetURL = {}

    for (i = 0; i < allQuads.length; i++) {
        //Get values of subject object and predicate from the quad
        subjectVal = correctOntologyLink(allQuads[i].subject.value);
        objectVal = correctOntologyLink(allQuads[i].object.value);
        predicateVal = correctOntologyLink(allQuads[i].predicate.value);
        //Ignore hierarchial code values for knowledge graph
        if (subjectVal.includes("n3-") || objectVal.includes("n3-") || !subjectVal.includes("http")) {
            continue;
        }
        if (subjectVal.includes("DOID_") && !(subjectVal in parsedDiseaseInfo)) {
            diseaseInfo = await getDiseaseInfo(subjectVal)
            parsedDiseaseInfo[subjectVal] = diseaseInfo;
        }
        if (objectVal.includes("DOID_") && !(objectVal in parsedDiseaseInfo)) {
            diseaseInfo = await getDiseaseInfo(objectVal)
            parsedDiseaseInfo[objectVal] = diseaseInfo
        }
        //Check if subject has already been added to joinedNodes before adding again
        if (!(subjectVal in joinedNodes)) {
            joinedNodes[subjectVal] = getDefaultNodeStructure(subjectVal);
        }
        //For observations, check if their dataset isn't set and set it
        if (joinedNodes[subjectVal].dataset == "Linked Data") {
            joinedNodes[subjectVal].dataset = getDataset(subjectVal, objectVal);
        }
        //Get relationship from predicate and object
        relationship = await getRelationship(predicateVal, objectVal, parsedDiseaseInfo);
        if (relationship != null) {
            joinedNodes[subjectVal].relationships.push(relationship)
        }
        //Get Dataset Name and Ontology Name from Subject
        subjedited = ""
        pos = subjectVal.indexOf("#");
        if (pos >= 0) {
            if (subjectVal.includes("dataset-")) {
                datasetName = subjectVal.substring(subjectVal.lastIndexOf("-") + 1)
                if (datasetList.indexOf(datasetName) < 0) {
                    datasetList.push(datasetName);
                    datasetURL[datasetName] = ""
                }
            }
            subjedited = subjectVal.substring(0, pos);
            subjedited = subjedited.match(/^https?:\/\/[^#?\/]+/)[0];
            slash = subjedited.lastIndexOf('/');
            subjedited = subjedited.substring(slash + 1);
            if (ontologyList.indexOf(subjedited) < 0) {
                ontologyList.push(subjedited);
            }
        }
        else {
            subjedited = subjectVal.match(/^https?:\/\/[^#?\/]+/)[0];
            slash = subjedited.lastIndexOf('/');
            subjedited = subjedited.substring(slash + 1);
            if (ontologyList.indexOf(subjedited) < 0) {
                ontologyList.push(subjedited);
            }
        }
        joinedNodes[subjectVal].group = subjedited;

        if (objectVal.includes("http")) { //create a node for object for optimization
            objedited = ""
            if (!(objectVal in joinedNodes)) {
                joinedNodes[objectVal] = getDefaultNodeStructure(objectVal)
            }
            if (joinedNodes[objectVal].dataset == "Linked Data") {
                joinedNodes[objectVal].dataset = getDataset(subjectVal, objectVal);
            }
            //Decide link value based on whether or not node part of a dataset
            value = 45;
            if (objectVal.includes("dataset-") || subjectVal.includes("dataset-")) {
                value = 20;
            }
            //adds dataset URL
            if (subjectVal.includes("dataset-") && predicateVal.includes("#isDefinedBy")) {
                datasetURL[getDataset(subjectVal, objectVal)] = objectVal
            }
            //Create a link between the subject and object node
            links.push({ "source": subjectVal, "target": objectVal, "value": value });
            //Get all available measures and dimensions in the RDF file and also add ontology list
            pos = objectVal.indexOf("#");
            if (pos >= 0) {
                if (predicateVal.includes("measure")) //measure
                {
                    measureVal = objectVal.substring(pos + 1)
                    if (measureList.indexOf(measureVal) < 0) {
                        measureList.push(measureVal);
                    }
                }
                if (predicateVal.includes("dimension") && subjectVal.includes("dsd-disease")) //dimension
                {
                    dimensionVal = objectVal.substring(pos + 1)
                    if (dimensionList.indexOf(dimensionVal) < 0) {
                        dimensionList.push(dimensionVal);
                    }
                }
                objedited = objectVal.substring(0, pos);
                objedited = objedited.match(/^https?:\/\/[^#?\/]+/)[0];
                slash = objedited.lastIndexOf('/');
                objedited = objedited.substring(slash + 1);
                if (ontologyList.indexOf(objedited) < 0) {
                    ontologyList.push(objedited);
                }
            }
            else {
                objedited = objectVal.match(/^https?:\/\/[^#?\/]+/)[0];
                slash = objedited.lastIndexOf('/');
                objedited = objedited.substring(slash + 1);
                if (ontologyList.indexOf(objedited) < 0) {
                    ontologyList.push(objedited);
                }
            }
            joinedNodes[objectVal].group = objedited;
        }
    }
    datasetList.push("Linked Data")
    ontologyList.push("")
    datasetURL["Linked Data"] = ""
    //create datastructure to be sent to frontend
    data = {
        "nodes": [],
        "links": links,
        "ontologylist": ontologyList,
        "datasets": datasetList,
        "dimensions": null,
        "measures": measureList
    };
    //create a dictionary for unique dimension values to be used in the frontend
    uniqueDimensionValues = {}
    for (var key in dimensionList) {
        uniqueDimensionValues[dimensionList[key]] = []
    }
    //loop through all nodes to find unique dimension values
    for (var key in joinedNodes) {
        //check if subject is a disease with no relationships and add disease name and definition to it
        if (joinedNodes[key].id.includes("DOID_") && Object.keys(joinedNodes[key].relationships).length <= 0) {
            joinedNodes[key].relationships.push({ "predicate": "Label", "object": parsedDiseaseInfo[joinedNodes[key].id].name })
            joinedNodes[key].relationships.push({ "predicate": "Description", "object": parsedDiseaseInfo[joinedNodes[key].id].definition })
        }
        joinedNodes[key].url = datasetURL[joinedNodes[key].dataset]
        //find all the unique values of dimensions and measures for frontend filters
        relationships = joinedNodes[key].relationships;
        for (ix in relationships) {
            relationship = relationships[ix];
            if (relationship.predicate.includes("dimension#")) {
                dimensionVal = relationship.predicate.substring(relationship.predicate.indexOf("#") + 1);
                joinedNodes[key].relationships[ix].predicate = dimensionVal
                if (dimensionVal.includes("refArea")) //this is area code, convert it to area name
                {
                    areaRelations = joinedNodes["http://www.w3.org/2003/01/geo/wgs84_pos#" + relationship.object].relationships
                    for (jx in areaRelations) {
                        areaRelation = areaRelations[jx]
                        if (areaRelation.predicate.includes("Label")) {
                            joinedNodes[key].relationships[ix].object = areaRelation.object
                            break;
                        }
                    }
                }
                if (dimensionVal in uniqueDimensionValues) {
                    if (uniqueDimensionValues[dimensionVal].indexOf(relationship.object) < 0) {
                        uniqueDimensionValues[dimensionVal].push(relationship.object);
                    }
                }
            }
        }
        data.nodes.push(joinedNodes[key])
    }
    data.dimensions = uniqueDimensionValues;

    /**
     * Routes Definitions
     */

    app.use(express.static(__dirname + '/Express'));
    app.use(bp.json())
    app.use(bp.urlencoded({ extended: false }))
    app.get("/", (req, res) => {
        res.status(200).sendFile(path.join(__dirname + '/Express/index.html'));
    });
    app.get("/other-charts", (req, res) => {
        res.status(200).sendFile(path.join(__dirname + '/Express/chart.html'));
    });
    app.post("/getRDFData", (req, res) => {
        return res.status(200).json({
            ok: true,
            data: data
        });
    });

    app.post("/filterData", (req, res) => {
        let data_copy = data
        let joined_nodes = joinedNodes
        return filterData(req, res, data_copy, joined_nodes);
    });
    app.post("/getByDataset", (req, res) => {
        let data_copy = data
        return getByDataset(req, res, data_copy);
    });
    app.post("/getChartData", (req, res) => {
        let data_copy = data
        return getChartData(req, res, data_copy);
    });
    /**
     * Server Activation
     */
    app.listen(port, () => {
        console.log(`Listening to requests on http://localhost:${port}`);
    });

}

launchApplication();