const Review = require('../models/Review');

// 指定された日にちのレビューを取得する関数
const getReviewsForDaysAgo = async (daysAgo, userId) => {
  /* 日付を取ってきて、1日の最初と最後の時間を設定 */
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - daysAgo);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(23, 59, 59, 999);

  return await Review.find({
    time: { $gte: startDate, $lte: endDate },
    user: userId
  });
};

// 各期間のレビューを取得する関数
const getAllReviews = async (userId) => {
  const reviews = {};

  reviews['reviews1DayAgo'] = await getReviewsForDaysAgo(1, userId);
  reviews['reviews7DaysAgo'] = await getReviewsForDaysAgo(7, userId);
  reviews['reviews30DaysAgo'] = await getReviewsForDaysAgo(30, userId);

  return reviews;
};

module.exports = getAllReviews;