import path from 'path';
import express from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
// @ts-ignore package has no official TypeScript type definitions.
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';

import userRouter from 'routes/userRoutes.js';
import postRouter from 'routes/postRoutes.js';

import globalErrorHandler from 'controllers/errorController.js';

import __dirname from 'constants/dirname.js';

const app = express();

// * 1) GLOBAL MIDDLEWARES
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//! deprecated
// app.use(mongoSanitize());
// app.use(xss());

// @ts-ignore package has no official TypeScript type definitions.
app.use(hpp({ whiteList: [] }));

// * 2) ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);

app.all('*path', (req, res, next) => {
  next();
});

app.use(globalErrorHandler);

export default app;
