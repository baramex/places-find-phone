const { default: axios } = require("axios");
const fs = require("fs");
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

    if (history.find(a => a.company == company)) {
        if (!history.find(a => a.company == company).international_phone_number) return res.status(400).send("No phone number");
        return res.status(200).json({ international_phone_number: history.find(a => a.company == company).international_phone_number });
    }

    var monthly = profil.requests.filter(a => new Date().getTime() - a.date < 1000 * 60 * 60 && a.endpoint == endpoint).length;
    if (monthly > 1000) return res.sendStatus(429);

    profil.requests.push({ endpoint, date: new Date().getTime() });
    credentials.save();

    axios.get(endpoints.find, { params: { input: company + " " + address, inputtype: "textquery", fields: "name,place_id", key: KEY } }).then(_res => {
        if (_res.data.candidates.length == 0) {
            history.cache.push({ company });
            history.save();
            return res.status(400).send("Company not found");
        }
        var name = _res.data.candidates[0].name.toLowerCase();
        var place_id = _res.data.candidates[0].place_id;

        if (name.startsWith(company) || name.endsWith(company) || name.includes(" " + company + " ")) {
            axios.get(endpoints.details, { params: { place_id, fields: "international_phone_number", key: KEY } }).then(__res => {
                var { international_phone_number } = __res.data.result;

                history.cache.push({ company, international_phone_number });
                history.save();

                if (!international_phone_number) return res.status(400).send("No phone number");
                return res.status(200).json({ international_phone_number });
            }).catch(err => {
                console.error(err?.response || err);
                return res.sendStatus(err?.response?.status || 400);
            });
        }
        else {
            history.cache.push({ company });
            history.save();

            return res.status(400).send("Company not found");
        }
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
        this.lastSave = 0;
        this.isSaving = false;
    }

    save() {
        if (this.isSaving) return;

        this.isSaving = true;
        if (new Date().getTime() - this.lastSave > 500) {
            fs.writeFile(this.path, JSON.stringify(this.cache, null, 4), {}, () => {
                this.isSaving = false;
            });
        }
        else {
            setTimeout(() => {
                fs.writeFile(this.path, JSON.stringify(this.cache, null, 4), {}, () => {
                    this.isSaving = false;
                });
            }, 500 - (new Date().getTime() - this.lastSave));
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