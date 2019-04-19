const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const ObjectId = mongoose.Schema.Types.ObjectId;
  // userId: ObjectId,

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
})

const Exercise = mongoose.model('Exercise', exerciseSchema);

const userSchema = new mongoose.Schema({
  username: String,
  exercises: {
    type: [exerciseSchema],
    default: []
  }
});

const User = mongoose.model('User', userSchema);

app.post('/api/exercise/new-user', (req, res)=>{
  console.log('/api/exercise/new-user', req.body);
  console.log(req.body);
  let user = new User({username: req.body.username});
  console.log(user);
  user.save((err)=>{
    if(err) return res.json({error: err});
    res.json(user);
  });
  /*
  .then((data)=>{
    console.log("User Created");
    res.json(data);
  })
  .catch(err=>{
    console.log("User Not Created");
    res.json({error: err});
  });
  */
});

app.get('/api/exercise/users', (req, res)=>{
  console.log('/api/exercise/users', req.body);
  User.find(null, (err, data)=>{
    if(err) return res.json({error: err});
    res.json(data);
  });
  /*.then((data)=>{
    res.json(data);
  })
  .catch(err=>{
    res.json({error: err});
  });*/
});

// /api/exercise/log?{userId}[&from][&to][&limit]
app.get('/api/exercise/log', (req, res)=>{
  console.log('/api/exercise/users', req.body);
  
  var query = User.findById(req.query.userId);
  if(req.query.from)
    query = query.$where('this.exercise.date >= ' + new Date(req.query.from));
  if(req.query.to)
    query = query.$where('this.exercise.date <= ' + new Date(req.query.to));
  if(req.query.limit)
    query = query.limit(req.query.limit)
  query.exec((err, data)=>{
    if(err) return res.json({error: err});
    res.json(data);
  }); 
});


app.post('/api/exercise/add', (req, res)=>{
  console.log('/api/exercise/add', req.body);
  User.findById(req.body.userId)
  .then(user=>{
    let date = new Date(req.body.date);
    let newExercise = new Exercise({description: req.body.description, duration: req.body.duration, date: date});  
    let exercises = user.exercises;
    exercises.push(newExercise);
    user.exercises = exercises;
    user.save()
    .then((data)=>{
      res.json(data);
    })
    .catch(err=>{
      res.json({error: err});
    });
  });      
});


// Not found middleware
app.use((req, res, next) => { 
  return next({status: 404, message: 'not found'})
})

// Error Handling middlewar
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
