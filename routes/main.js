const express = require('express');
const controllers = require('../controllers/main');

const router = express.Router();

router.route('/').get(controllers.getIndexPage); //pageController'da bulunan getIndexPage'e yönleniyor
router.route('/getSubscribedChannels/:userId').get(controllers.getSubscribedChannels); //pageController'da bulunan getSubscribedChannels'e yönleniyor
router.route('/getChannelVideos/:channelId').get(controllers.getChannelVideos); //pageController'da bulunan getChannel'e yönleniyor
router.get('/video/:videoId/comments', controllers.getCommentsOnVideo);
router.get('/comment/:commentId/replies', controllers.getRepliesToComment); 
router.get('/check-like/:userId/:videoId', controllers.checkUserLikedVideo);
router.get('/watch-history/:userId', controllers.getWatchHistory);
router.get('/user-videos/:userId', controllers.getUserUploadedVideos);
router.get('/search', controllers.searchVideos);
router.get('/check/:userId/:channelId', controllers.checkSubscription);
router.get('/searchChannel', controllers.searchChannels);


module.exports = router; 