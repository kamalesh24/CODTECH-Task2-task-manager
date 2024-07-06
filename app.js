//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

const dbUrl = "mongodb://localhost:27017/todoListDB";
//mongodb://localhost:27017  ?retryWrites=true&w=majority
mongoose.connect(dbUrl).then(() => {
    console.log("Connection successful");
}).catch((e) =>{
    console.log("Error: ", e);
});

const itemsSchema = new mongoose.Schema({
    name: String
});

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const Item = mongoose.model("item", itemsSchema);
const List = mongoose.model("list", listSchema);

const item1 = new Item({
    name: "Welcome to your Todolist!"
});
const item2 = new Item({
    name: "Hit + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

    run();
    async function run() {
        const items = await Item.find();
        if (items.length == 0) {
            Item.insertMany(defaultItems);
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: items
            });
        }
    }
});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    run();
    async function run() {
        const foundList = await List.findOne({name: customListName}).exec();

        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });

            list.save();
            res.redirect("/" + customListName);
        } else {
            res.render("list", {
                listTitle: foundList.name,
                newListItems: foundList.items
            });
        }
    }
})

app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
        name: itemName
    });

    if (listName === "Today") {
        newItem.save();
        res.redirect("/");
    } else {
        run();
        async function run() {
            const foundList = await List.findOne({
                name: listName
            }).exec();
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        }
    }
});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkBox;
    const listName = req.body.listName;

    run();
    async function run() {
        if (listName === "Today") {
            await Item.deleteOne({_id: checkedItemId});
            res.redirect("/");
        } else {
            const foundList = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
            if(foundList){
                res.redirect("/" + listName);
            }
        }
    }
});


app.get("/work", function(req, res) {
    res.render("list", {
        listTitle: "Work List",
        newListItems: workItems
    });
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});
