const mongoose = require('mongoose');
const { Schema } = mongoose;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({});

userSchema.plugin(passportLocalMongoose, {
  errorMessages: {
    UserExistsError: 'そのユーザー名はすでに使われています。',
    MissingPasswordError: 'パスワードを入力してください。',
    NoSaltValueStoredError: '認証ができませんでした',
    IncorrectPasswordError: 'パスワードまたはユーザーネームが間違っています。',
    IncorrectUsernameError: 'パスワードまたはユーザーネームが間違っています。',
    MissingUsernameError: 'ユーザーネームを登録してください。',
  }
});

module.exports = mongoose.model('User', userSchema);