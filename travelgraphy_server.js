var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded()); // to support URL-encoded bodies

var database;

function mergeJSON(json1, json2)
{
    for (var z in json2)
    {
        json1[z] = json2[z];
    }

    return json1;
}

function readJSON(filename)
{
    var parsedData = JSON.parse(fs.readFileSync( __dirname + "/database/" + filename, 'utf8'));

    return parsedData;
}

function createDB()
{
    
    var profileModel = readJSON("ProfileModel.json");
    var destinationModel = readJSON("DestinationModel.json");
    var travelgrapherModel = readJSON("TravelgrapherModel.json");
    var travelgrapherServiceModel = readJSON("TravelgrapherServiceModel.json");
    var travelgrapherGadgetModel = readJSON("TravelgrapherGadgetModel.json");
    var travelgrapherReviewModel = readJSON("TravelgrapherReviewModel.json");
    var travelgrapherPortfolioModel = readJSON("TravelgrapherPortfolioModel.json");
    var travelModels = readJSON("TravelModels.json");

    database = mergeJSON(profileModel, destinationModel);
    database = mergeJSON(database, travelgrapherModel);
    database = mergeJSON(database, travelgrapherServiceModel);
    database = mergeJSON(database, travelgrapherGadgetModel);
    database = mergeJSON(database, travelgrapherReviewModel);
    database = mergeJSON(database, travelgrapherPortfolioModel);
    database = mergeJSON(database, travelModels);
}

function getJSONList(IDs, modelName)
{
    var modelList = database[modelName];
    var rcModelList = [];

    for(idx in IDs)
    {
        var id = IDs[idx];

        for(idx2 in modelList)
        {
            if(modelList[idx2]["id"] == id)
            {
                rcModelList.push(modelList[idx2]);
                break;
            }
        }
    }

    return rcModelList;
}

function populateTravelgrapherDetails(profile)
{
    var travelgraphers = database["Travelgraphers"];
    var targetProfile;

    for(idx2 in travelgraphers)
    {
        if( travelgraphers[idx2]["profile"] == profile["id"] )
        {
            var tmp = profile;
            targetProfile = travelgraphers[idx2];
            targetProfile["profile"] = tmp;

            targetProfile["destinations"] = getJSONList(targetProfile["destinations"], "Destinations");
            targetProfile["services"] = getJSONList(targetProfile["services"], "Services");
            targetProfile["gadgets"] = getJSONList(targetProfile["gadgets"], "Gadgets");
            targetProfile["reviews"] = getJSONList(targetProfile["reviews"], "Reviews");

            console.log("Profile is a travelgrapher!");
            console.log(JSON.stringify(targetProfile));

            break;
        }
    }

    return targetProfile;
}


app.get('/listDestinations', function (req, res)
{
    var destinations = database["Destinations"];
    res.json(destinations);
})

app.get('/listTravelgraphers', function (req, res)
{
    var travelgraphers = database["Travelgraphers"];
    res.json(travelgraphers);
})

app.get('/listTravelgraphers:destination_id', function (req, res)
{
    var travelgraphers = database["Travelgraphers"];
    var targetTravelgraphers = [];

    for( idx in travelgraphers )
    {
        var entry = travelgraphers[idx];

        var found = 0;        
        for( dst_idx in entry["destinations"] )
        {
            if( entry["destinations"][dst_idx] == req.params.destination_id )
            {
                console.log(entry);
                found = 1;
                break;
            }
        }

        if(found == 1)
            targetTravelgraphers.push(entry);
    }

    res.json(targetTravelgraphers);
})

app.get('/listTravels', function (req, res)
{
    var travels = database["Travels"];
    res.json(travels);
})

app.get('/listTravelsByTravelgrapher:travelgrapher_id', function (req, res)
{
    var travels = database["Travels"];
    var targetTravels = [];

    for(idx in travels)
    {
        if( travels[idx]["travelgrapher id"] == req.params.travelgrapher_id )
            targetTravels.push(travels[idx]);
    }

    res.json(targetTravels);
})

app.get('/listTravelsByTraveller:traveller_id', function (req, res)
{
    var travels = database["Travels"];
    var targetTravels = [];

    for(idx in travels)
    {
        if( travels[idx]["traveller id"] == req.params.traveller_id )
            targetTravels.push(travels[idx]);
    }

    res.json(targetTravels);
})

app.post('/login', function (req, res)
{
    var username = req.body.username;
    var password = req.body.password;
    var profileType = req.body.type; //0-traveller, 1-travelgrapher

    var profiles = database["Profiles"];

    var targetProfile = [];

    for(idx in profiles)
    {
        if( profiles[idx]["id"] == username && profiles[idx]["pw"] == password )
        {
            var targetProfile = profiles[idx];
            delete targetProfile["pw"];

            console.log("Profile found!");
            console.log(JSON.stringify(targetProfile));

            if(profileType == 1)
            {
                targetProfile = populateTravelgrapherDetails(targetProfile);
            }

            break;
        }
    }

    res.json(targetProfile);
})



var server = app.listen(8081, function ()
{
    createDB();

    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})
