const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required:true,
  },
  answer: {
    type: String,
    required:true,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;