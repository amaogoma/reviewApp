const mongoose = require('mongoose');
const Review = require('./models/Review');

mongoose.connect('mongodb://localhost:27017/reviewApp')
.then( () => {
  console.log('MongoDBコネクションOK！');
})
.catch(err => {
  console.log('MongoDBコネクションエラー！！！');
  console.log(err);
});

const R = new Review({
  category: 'デモデータ',
  question: 'デモデータ',
  answer: 'デモデータ',
});
R.save().then(s => {
  console.log(s);
}).catch(e => {
  console.log(e);
});

