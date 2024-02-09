const userService = require('../service/user-service');
const ApiError = require('../exceptions/api-error');
const {
  Post,
  PostLike,
  Comment,
  User,
  Image,
  CommentLike,
} = require('../../db/models');

module.exports.create = async (req, res, next) => {
  try {
    const { header, body, isPosted, images } = req.body.postData;

    const { refreshToken } = req.cookies;
    const userData = await userService.findUser(refreshToken);
    const post = await Post.create({
      user_id: userData.user.id,
      header,
      body,
      isPosted,
    });
    if (images) {
      images.forEach(async (image) => {
        console.log('image', image);
        const img = await Image.findOne({ where: { id: image.id } });
        console.log('img', img);
        img.post_id = post.id;
        await img.save();
      });
    }
    const postToFront = await Post.findOne({
      where: {
        id: post.id,
      },
      include: [PostLike, Comment, User, Image],
    });
    res.status(201).json(postToFront);
  } catch (err) {
    next(err);
  }
};

module.exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { header, body, isPosted, images } = req.body.postData;

    const post = await Post.findOne({ where: { id } });

    post.update({
      header,
      body,
      isPosted,
    });
    post.save();
    if (images) {
      images.forEach(async (image) => {
        console.log('image', image);
        const img = await Image.findOne({ where: { id: image.id } });
        console.log('img', img);
        img.post_id = post.id;
        await img.save();
      });
    }
    const postToFront = await Post.findOne({
      where: {
        id: post.id,
      },
      include: [PostLike, Comment, User, Image],
    });
    res.status(201).json(postToFront);
  } catch (err) {
    next(err);
  }
};

module.exports.getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const posts = await Post.findAll({
      where: {
        user_id: id,
      },
      include: [
        PostLike,
        Comment,
        User,
        {
          model: Image,
          order: [['id', 'DESC']],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};
module.exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: [PostLike, Comment, User, Image],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};
module.exports.getOnePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findOne({
      where: {
        id: postId,
      },
      include: [
        PostLike,
        {
          model: Comment,
          include: [CommentLike, User],

          // include: [User],
        },

        User,
        {
          model: Image,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    console.log('post', post);

    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

module.exports.setLike = async (req, res, next) => {
  try {
    const { userId, postId } = req.body;

    const postExists = await Post.findByPk(postId);
    if (!postExists) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userExists = await User.findByPk(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingLike = await PostLike.findOne({
      where: {
        user_id: userId,
        post_id: postId,
      },
    });

    if (!existingLike) {
      await PostLike.create({
        user_id: userId,
        post_id: postId,
      });
      res.status(200).json({ message: 'Like added successfully' });
    } else {
      await existingLike.destroy();
      res.status(200).json({ message: 'Like removed successfully' });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};