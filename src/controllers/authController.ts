import type { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import User, { UserData } from 'models/userModel.js';

import { createSendToken } from 'services/authService.js';

import AppError from 'utils/appError.js';
import catchAsync from 'utils/catchAsync.js';

export const signup = catchAsync(
  async (req: Request<{}, {}, UserData>, res: Response, next: NextFunction) => {
    const newUser = await User.create(req.body);
    createSendToken(newUser, 201, res);
  },
);

export const login = catchAsync(
  async (
    req: Request<{}, {}, Pick<UserData, 'username' | 'password'>>,
    res: Response,
    next: NextFunction,
  ) => {
    const { username, password } = req.body;

    // 1) Check if username and password exist
    if (!username || !password) {
      return next(new AppError('Please provide username and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ username }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect username or password!', 401));
    }

    // 3) If everything is ok, send token to the client
    createSendToken(user, 200, res);
  },
);

export const logout = (req: Request, res: Response, next: NextFunction) => {
  res.clearCookie('jwt');
  res.status(200).json({ status: 'success' });
};

export const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.json({ status: 'success', data: { data: { user } } });
  },
);

export const attachUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const jwtVerifyPromisified = (token: string, secret: string) => {
      return new Promise((resolve, reject) => {
        jwt.verify(token, secret, {}, (err, payload) => {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        });
      });
    };

    const decoded = (await jwtVerifyPromisified(
      token,
      process.env.JWT_SECRET as string,
    )) as JwtPayload;

    const currentUser = await User.findById(decoded.id);
    req.user = currentUser ?? null;

    next();
  },
);

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // 1) Getting the token and check if it's there
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError(
          'You are not logged in! Please log in to get access.',
          401,
        ),
      );
    }

    // 2) Verify token
    const jwtVerifyPromisified = (token: string, secret: string) => {
      return new Promise((resolve, reject) => {
        jwt.verify(token, secret, {}, (err, payload) => {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        });
      });
    };

    const decoded = (await jwtVerifyPromisified(
      token,
      process.env.JWT_SECRET as string,
    )) as JwtPayload;

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist.',
          401,
        ),
      );
    }

    // Grant access to the protected route
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  },
);
