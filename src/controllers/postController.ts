import Post from 'models/postModel.js';

import * as factory from 'controllers/factoryController.js';

import catchAsync from 'utils/catchAsync.js';
import AppError from 'utils/appError.js';

export const getAllPosts = factory.getAll(Post);
export const getPost = factory.getOne(Post);
export const deletePost = factory.deleteOne(Post);

export const createPost = catchAsync(async (req, res, next) => {
  const doc = await Post.create({ ...req.body, userId: req.user.id });

  res.status(201).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});

export const updatePost = catchAsync(async (req, res, next) => {
  const doc = await Post.findByIdAndUpdate(
    req.params.id,
    { ...req.body, userId: req.user.id },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});
