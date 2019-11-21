/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var assert = require("assert");


const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      var query = req.query;
      if (query._id) query._id = new ObjectId(query._id);
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, function(err, client) {
        assert.equal(null, err);
        var issueCol = client.db("projects").collection("issues");
        issueCol.find(query).toArray(function(err, result) {
          res.json(result);
        });
        client.close();
      });
    })
    
    .post(function (req, res){
      var project = req.params.project;
      var {issue_title, issue_text, created_by} = req.body;
      if (issue_title === "" || issue_text === "" || created_by === "") {
        res.send("missing inputs");
      } else {
        var newIssue = {
          issue_title, issue_text, created_by,
          assigned_to: req.body.assigned_to || "",
          status_text: req.body.status_text || "",
          created_on: new Date(),
          updated_on: new Date(),
          open: true
        };
        MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, function(err, client) {
          assert.equal(null, err);
          var issueCol = client.db("projects").collection("issues");
          issueCol.insertOne(newIssue, function(err, doc) {
            assert.equal(null, err);
            newIssue._id = doc.insertedId;
            res.json(doc.ops[0]);
          });
          client.close();
        })
      }
      
    })
    
    .put(function (req, res){
      var project = req.params.project;
      var filled = Object.keys(req.body).filter(e => e !== "_id").every(ele => req.body[ele] === "");
      if (filled) {
        res.send("no updated field sent");
      } else if (/^[0-9a-fA-F]+$/.test(req.body._id) === false) {
        res.send("could not update "+req.body._id);
      } else {
        var id = new ObjectId(req.body._id);
        var checked;
        (req.body.open === undefined) ? checked = true: checked = false;
        var updateIssue = {
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to,
          status_text: req.body.status_text,
          updated_on: new Date(),
          open: checked
        };

        Object.keys(updateIssue).forEach(key => updateIssue[key] === "" ? delete updateIssue[key] : '');
        MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, function(err, client) {
          assert.equal(null, err);
          var issueCol = client.db("projects").collection("issues");
          issueCol.updateOne({_id: id}, {$set: updateIssue}, { returnOriginal: false }, function(err, doc) {
            assert.equal(null, err);
            (doc.modifiedCount === 1) ? res.send("successfully updated") : res.send("could not update "+id);
          });
          client.close();
        })
      }
    })
    
    .delete(function (req, res){
      var project = req.params.project;
      if (req.body._id === "") {
        res.send("_id error");
      }
      var id = new ObjectId(req.body._id);
      if (/^[0-9a-fA-F]+$/.test(id) === false) {
        res.send("could not delete "+id)
      } else {
        MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, function(err, client) {
          assert.equal(null, err);
          var issueCol = client.db("projects").collection("issues");
          issueCol.findOneAndDelete({_id: id}, function(err, result) {
            if (err) res.send("could not delete "+id);
            res.send('deleted '+result.value._id);
          });
          client.close();
        })
      }
    });
  
    
};
















