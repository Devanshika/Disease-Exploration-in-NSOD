# Diseases Exploration in Nova Scotia Open Data

The application’s back end is built off an ontology that the team created using Protégé and designed specifically for open statistical data. The ontology contains industry standard vocabularies (rdf, sdmx, rdfs, dcterms), links with external ontologies (disease ontology, geonames), semantics and SWRL rules that give the application a strong logical backbone. This is part of a research paper currently submitted to a peer-reviewed and high-quality journal for publication. 

The ontology is then imported to create a knowledge graph. The case covered is disease datasets. The Nova Scotia disease datasets are linked to each other as well as to external datasets (Alberta open data) using the designed ontology. The knowledge graph is encoded on python, is autonomous, and works on the data and metadata through Socrata Api for updating and appending new disease datasets. 

We built a web-based application on top of this knowledge graph, that uses node.js for server and simple html, css and js for client implementation. The application uses a library (rdf-parse) to traverse and query the knowledge graph. D3 version 6.5.0 is used to display a SVG force directed graph with nodes as data and interlinking between the nodes of the graph which are related to each other. 

The application end point has functionality to filter all nodes by year or region of health datasets. This dynamically changes the graph to only show filtered data and data that is linked to them. The application also has a search functionality that can be used to search through the knowledge graph. The graph also shows either linked data sources or linked datasets as legend for nodes which allows the user to understand the interlinking better. 

Hovering over each node displays tooltip with more information about that node and the graph nodes can also be moved around to display a different view of the graph. Other functionality includes viewing data from different ontologies in a visually aesthetic way using SPARQL for fetching data and D3 for displaying it. The results are displayed in an easy-to-read and thorough dashboard that conveys all important information to the users conveniently. 


## How To Use

1. Install Node.JS

1. Launch Command Prompt in Root Directory.

1. Enter command *npm install* to install all dependencies.

1. Enter command *npm start* to start the server.

1. Type *localhost:8000* in your browser to use the application.
