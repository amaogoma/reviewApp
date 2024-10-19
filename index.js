const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const catchAsync = require('./utils/catchAsync');
const AppError = require('./utils/AppError');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const favicon = require('serve-favicon');
const dotenv = require('dotenv').config();
const MongoStore = require('connect-mongo');

const { isLoggedIn } = require('./utils/isLoggedIn');
const getAllReviews = require('./utils/getReviews');


const Review = require('./models/Review');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDBコネクションOK！');
  })
  .catch(err => {
    console.log('MongoDBコネクションエラー！！！');
    console.log(err.message);
  });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

const sessionConfig = {
  secret: 'mysecret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions', // セッションのコレクション名
  }),  
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.get('/', (req, res) => {
  res.render('products/login'); 
});

/* ユーザー登録 */
app.get('/products/register', (req, res) => {
  res.render('products/register');
});

app.post('/products/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username });
    await User.register(user, password)
    req.flash('success','登録が完了しました' );
    res.redirect('/products');
  } catch(e) {
    req.flash('error', e.message);
    res.redirect('/products/register');
  }
});

/* ログイン */
app.get('/products/login', (req, res) => {
  res.render('products/login')
})

app.post('/products/login',passport.authenticate('local',{failureFlash: true, failureRedirect:'/products/login'}), (req, res) => {
  req.flash('success', 'ログインしました。')
  res.redirect('/products');
});

/* ログアウト */
app.get('/products/logout', (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success', 'ログアウトしました。');
    res.redirect('/products/login')
  });
});


/* ------------------------------------
   ホーム画面 */
/* 本日の復習内容 */
app.get('/products',isLoggedIn, catchAsync(async (req, res) => {
    const reviews = await getAllReviews(req.user._id); // レビューを取得
    res.render('products', reviews); // レビューをテンプレートに渡す
}));

/* ---------------------------------
    30日後の処理 */
/* remember */
app.delete('/products/remembered/:id', catchAsync(async (req, res) => {
  const { id } = req.params;
  await Review.findByIdAndDelete(id);
  req.flash('success', '覚えられました！！');
  res.redirect('/products');
}));

/* notRemembered */
app.put('/products/notRemembered/:id', catchAsync(async (req, res) => {
  const { id } = req.params;

  await Review.findByIdAndUpdate(id, { time: new Date() });
  req.flash('error', 'もう一回頑張りましょう');
  res.redirect('/products');

}));

/* ----------------------------------
    1か月の学習記録 */

app.get('/products/record',isLoggedIn, (req, res) => {
  res.render('products/record');
});

app.post('/products/selectedDay', isLoggedIn, catchAsync(async (req, res) => {
  const { date } = req.body;
  if (!date) {
    return res.redirect('/products/record');
  }

  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const reviewsForSelectedDay = await Review.find({
    time: { $gte: startOfDay, $lte: endOfDay },
    user: req.user._id
  });
  res.render('products/record', { reviewsForSelectedDay, selectedDate: date });

}));



/* -----------------------------------
   学習内容の登録,追加 */
app.post('/products', isLoggedIn, catchAsync(async (req, res) => {
  const { category, question, answer } = req.body;
  const user = req.user
  const newReview = new Review({ category, question, answer, user: user._id });
  await newReview.save();
  req.flash('success', '学習内容を登録しました')
  res.redirect('/products/show');
}));

app.get('/products/new',isLoggedIn, (req, res) => {
  res.render('products/new');
});

/* ---------------------------------
    本日の学習内容一覧 */
app.get('/products/show',isLoggedIn, catchAsync(async (req, res) => {
  const now = new Date();

  // 今日の開始（0時0分0秒）
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // 今日の終了（23時59分59秒）
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // 当日に登録されたデータを取得
  const todayReviews = await Review.find({
    user: req.user._id,
    time: { $gte: startOfToday, $lte: endOfToday }
  });
  res.render('products/show', { todayReviews,});
}));

/* ---------------------------------
   登録した学習内容の編集 */
app.get('/products/:id/edit', catchAsync(async (req, res) => {
  const { id } = req.params;
  const review = await Review.findById(id);
  if (!review || review.user.toString() !== req.user._id.toString()) {
    req.flash('error', 'アクセス権限がないかデータがありません');
    return res.redirect('/products/show');
  }
  res.render('products/edit', { review });
}));

app.put('/products/:id', catchAsync(async (req, res) => {
  const { id } = req.params;
  const updatedReview = await Review.findByIdAndUpdate(id, req.body, {
    runValidators: true,
    new: true // 更新後の新しいデータを返す
  });
  if (!updatedReview) {
    return res.status(404).send('Review not found');
  }
  res.redirect('/products/show');
}));

/* ---------------------------------
   本日の学習内容の削除 */
app.delete('/products/:id', catchAsync(async (req, res) => {
  const { id } = req.params;
  const deleteReview = await Review.findByIdAndDelete(id);
  res.redirect('/products/show')
}));


/* エラー処理 */
app.all('*', (req, res, next) => {
  next(new AppError('ページが見つかりませんでした。', 404));
})

app.use((err, req, res, next) => {
  console.error(`Error message: ${err.message}`); // エラーメッセージを表示
  console.error(err); 

  const { statusCode = 500 } = err
  if(!err.message) {
    err.message = '問題が起きました'
  }
  res.status(statusCode).render('products/error', { err });
})

module.exports = app;