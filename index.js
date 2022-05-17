const { default: axios } = require("axios");
const fs = require("fs");
const stringSimilarity = require("string-similarity");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const KEY = process.env.KEY;

var app = express();
app.use(cors({
    origin: "*"
}))

app.listen(5600);

const endpoints = { find: "https://maps.googleapis.com/maps/api/place/findplacefromtext/json", details: "https://maps.googleapis.com/maps/api/place/details/json" };

app.get("/phone-number", (req, res) => {
    var auth = req.headers.authorization;

    var company = req.query.company;
    var address = req.query.address;

    if (!auth) return res.sendStatus(401);
    if (!company || !address) return res.sendStatus(400);

    company = company.toLowerCase();
    address = address.toLowerCase();

    var endpoint = req.method.toUpperCase() + " " + req.path;
    var profil = credentials.find(a => auth == a.token_type + " " + a.token);

    if (!profil || !profil.permissions.includes(endpoint)) return res.sendStatus(403);

    history.cache = history.cache.filter(a => new Date().getTime() - a.date < 1000 * 60 * 60 * 24 * 30);
    history.save();

    if (history.find(a => a.company == company)) {
        if (!history.find(a => a.company == company).international_phone_number) return res.status(400).send("No phone number");
        return res.status(200).json({ international_phone_number: history.find(a => a.company == company).international_phone_number });
    }

    profil.requests = profil.requests.filter(a => new Date().getTime() - a.date < 1000 * 60 * 60 * 24 * 30);

    var monthly = profil.requests.filter(a => a.endpoint == endpoint).length;
    if (monthly > 2000) {
        credentials.save();
        return res.sendStatus(429);
    }

    profil.requests.push({ endpoint, date: new Date().getTime() });
    credentials.save();

    axios.get(endpoints.find, { params: { input: company + " " + address, inputtype: "textquery", key: KEY } }).then(_res => {
        if (_res.data.status == "REQUEST_DENIED") return res.status(400).send(_res.data.error_message || "Error");

        if (_res.data.status == "ZERO_RESULTS") {
            history.cache.push({ company, date: new Date().getTime() });
            history.save();
            return res.status(400).send("Company not found");
        }

        var place_id = _res.data.candidates[0].place_id;

        if (history.find(a => a.place_id == place_id)) {
            if (!history.find(a => a.place_id == place_id).international_phone_number) return res.status(400).send("No phone number");
            return res.status(200).json({ international_phone_number: history.find(a => a.place_id == place_id).international_phone_number });
        }

        axios.get(endpoints.details, { params: { place_id, fields: "international_phone_number,name", language: "fr", key: KEY } }).then(__res => {
            var name = __res.data.result.name.toLowerCase();

            var simComp = company;
            if (simComp.includes("(") && simComp.includes(")")) {
                simComp = simComp.replace(/ *\([^)]*\)*/g, "");
            }
            if (stringSimilarity.compareTwoStrings(simComp, name) >= 0.6 || name.startsWith(simComp) || name.endsWith(simComp) || name.includes(" " + simComp + " ")) {
                var international_phone_number = __res.data.result?.international_phone_number;

                history.cache.push({ company, place_id, international_phone_number, date: new Date().getTime() });
                history.save();

                if (!international_phone_number) return res.status(400).send("No phone number");
                return res.status(200).json({ international_phone_number });
            }
            else {
                history.cache.push({ company, place_id, date: new Date().getTime() });
                history.save();

                return res.status(400).send("Company not found");
            }
        }).catch(err => {
            console.error(err?.response || err);
            return res.sendStatus(err?.response?.status || 400);
        });
    }).catch(err => {
        console.error(err?.response || err);
        return res.sendStatus(err?.response?.status || 400);
    });
});

function createCredentials(permissions) {
    var token = generateToken();

    credentials.cache.push({ token_type: "Token", token, permissions, requests: [], date: new Date().getTime() });
    credentials.save();
}

function generateToken() {
    var length = 40;
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    var point = Math.floor(Math.random() * (length - 5) + 5);

    for (var i = 0; i < length; i++) {
        if (i % point == 0 && i != 0) result += ".";
        else result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

class JsonDatabase {
    constructor(_path) {
        this.path = _path;

        if (!fs.existsSync(_path)) fs.writeFileSync(_path, "[]");

        this.cache = JSON.parse(fs.readFileSync(_path));
        this.bcachel = JSON.stringify(this.cache).length;
        this.lastSave = 0;
        this.isSaving = false;
    }

    save() {
        if (this.isSaving || this.bcachel == JSON.stringify(this.cache).length) return;

        this.isSaving = true;
        if (new Date().getTime() - this.lastSave > 1000) {
            fs.writeFile(this.path, JSON.stringify(this.cache, null, 4), {}, () => {
                this.isSaving = false;
                this.lastSave = new Date().getTime();
                this.bcachel = JSON.stringify(this.cache).length;
            });
        }
        else {
            setTimeout(() => {
                fs.writeFile(this.path, JSON.stringify(this.cache, null, 4), {}, () => {
                    this.isSaving = false;
                    this.lastSave = new Date().getTime();
                    this.bcachel = JSON.stringify(this.cache).length;
                });
            }, 1000 - (new Date().getTime() - this.lastSave));
        }
    }

    find(filter) {
        return Object.values(this.cache).find(filter);
    }

    get(key) {
        return this.cache[key];
    }
}

const credentials = new JsonDatabase(path.join(__dirname, "credentials.json"));
const history = new JsonDatabase(path.join(__dirname, "history.json"));