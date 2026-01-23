import { Document, InferSchemaType, model, Query, Schema } from 'mongoose';

import AppError from 'utils/appError.js';

const operations = ['+', '-', '*', '/'] as const;
type Operation = (typeof operations)[number];

const postSchema = new Schema({
  parentId: {
    type: Schema.ObjectId,
    ref: 'Post',
  },
  userId: {
    type: Schema.ObjectId,
    ref: 'User',
    required: [true, 'A post must belong to a user!'],
  },
  operand: {
    type: Number,
    required: [true, 'A post must have an operand!'],
  },
  operation: {
    type: String,
    enum: operations,
    validate: [
      {
        validator: function (val: string) {
          return !(val === '/' && this.operand === 0);
        },
        message: 'Cannot divide by zero!',
      },
      {
        validator: function (val: string) {
          if (!!this.parentId) {
            return !!val;
          }

          return true;
        },
        message: 'A post must have an operation!',
      },
    ],
  },
  value: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export function compute(
  parentValue: number,
  operation: '+' | '-' | '*' | '/',
  operand: number,
): number {
  switch (operation) {
    case '+':
      return parentValue + operand;
    case '-':
      return parentValue - operand;
    case '*':
      return parentValue * operand;
    case '/':
      return parentValue / operand;
    default:
      return 1;
  }
}

postSchema.pre('save', async function () {
  if (!this.parentId) {
    this.value = this.operand;
    return;
  }

  const parent = (await this.model('Post').findById(this.parentId)) as IPost;
  if (!parent) throw new AppError('Parent post not found!', 404);

  this.value = compute(
    parent.value as number,
    this.operation as Operation,
    this.operand,
  );
  return;
});

postSchema.pre<Query<PostData, PostData>>(/^find/, function () {
  this.populate({ path: 'parentId', select: '-__v' }).populate({
    path: 'userId',
    select: '-__v',
  });
});

export type PostData = InferSchemaType<typeof postSchema>;
export interface IPost extends Document, PostData {}

const Post = model<IPost>('Post', postSchema);

export default Post;
