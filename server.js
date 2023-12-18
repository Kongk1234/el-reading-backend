const express = require("express");
const mysql = require("mysql");
const app = express();
const multer = require("multer");
const bodyParser = require("body-parser");
const cors = require("cors");
const excel = require("read-excel-file/node");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./xl/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const path = multer({ storage: storage }).single("uploaded_file");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Bfk57hem!",
  database: "elReading",
  timezone: "utc",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

app.delete("/delete", function (req, res) {
  console.log(req.body);
  con.query(
    "delete from readingData where el = ?",
    [req.body.json.row],
    function (err, result) {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.post("/year", function (req, res) {
  con.query(
    "select * from readingData where YEAR(date) = ? order by id desc",
    [req.body.json.year],
    function (err, result) {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.post("/things", function (req, res) {
  con.query(
    "insert into readingData(el, kwh, water, m3, heat, mwh, date) values (?,?,?,?,?,?,?)",
    [
      req.body.json.el,
      req.body.json.kwh,
      req.body.json.water,
      req.body.json.m3,
      req.body.json.heat,
      req.body.json.mwh,
      req.body.json.date,
    ],
    function (err, result) {
      if (err) throw err;
    }
  );
  res.send(req.body);
});

function timer(year, yearjson) {
  con.query(
    "select el, heat, water, year(date) as timer  from readingData where year(date) = ?",
    [year],
    function (err, result) {
      yearjson.push(result);
    }
  );
}

app.get("/getData", function (req, res) {
  let yearjson = [];
  let years = [];
  con.query(
    "select year(date) as time from readingData group by year(date)",
    function (err, result) {
      let resultArr = [];
      result.forEach((element) => {
        resultArr.push(element.time);
      });
      resultArr.sort();
      resultArr.forEach((element) => {
        timer(element, yearjson);
        years.push(element);
      });
    }
  );
  setTimeout(() => {
    res.send({ data: yearjson, time: years });
  }, 10);
});

app.post("/files", function (req, res) {
  path(req, res, (err) => {
    if (err) res.status(500).send("nono");
    excel(`./xl/${req.file.originalname}`).then((rows) => {
      for (let index = 1; index < rows.length - 1; index++) {
        con.query(
          "insert into readingData(elHouse, elFirst, kw, date) values (?,?,?,?)",
          [rows[index][1], rows[index][6], 2.3, rows[index][0]],
          function (err, result) {
            if (err) throw err;
          }
        );
      }
    });
    res.status(301).redirect("https://el.linde-barrith.dk/");
  });
});

app.listen(42069);
