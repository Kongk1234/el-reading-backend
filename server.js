const express = require("express");
const mysql = require("mysql");
const app = express();
const multer = require('multer');
const bodyParser = require("body-parser")
const cors = require("cors");
const excel = require('read-excel-file/node')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, './xl/');
    },
  filename: function (req, file, cb) {
      cb(null, file.originalname);
  }
});

const path = multer({storage: storage}).single("uploaded_file")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());



const con = mysql.createConnection({
    host: "localhost",
    user: "kasper",
    password: "Bfk57hem+",
    database: "elReading",
    timezone: "utc"
  });
  
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });
  
  app.post("/year", function(req, res) {
    con.query("select * from readingData where YEAR(date) = ? order by id desc", [req.body.json.year], function(err, result){
      if(err) throw err;
      res.send(result);
    });
  })

  app.post("/things", function(req, res) {
    con.query("insert into readingData(elHouse, elFirst, kw, date) values (?,?,?,?)", [req.body.json.elHouse, req.body.json.elFirst, req.body.json.kw, req.body.json.date], function(err, result){
      if(err) throw err;
  });
  res.send(req.body);
  })


  app.post("/files", function(req, res) {
    path(req, res, (err) =>{
      if (err) res.status(500).send("Fuck");      
      setTimeout(() => {
        excel(`./xl/${req.file.originalname}`).then((rows) => {
          for (let index = 1; index < rows.length -1; index++) {
            con.query("insert into readingData(elHouse, elFirst, kw, date) values (?,?,?,?)", [rows[index][1], rows[index][6], 2.3, rows[index][0]], function(err, result){
              if(err) throw err;
            });
          }
        })
      res.send("Successful");
      }, 1000);  
    });
  });


app.listen(42069)