import {Request, Response, NextFunction, response} from 'express';
import CustomError from '../../classes/CustomError';
import {User, OutputUser} from '../../interfaces/User';
import {validationResult} from 'express-validator';
import userModel from '../models/userModel';
import bcrypt from 'bcrypt';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
const salt = bcrypt.genSaltSync(12);

const check = (req: Request, res: Response) => {
  res.json({message: 'Server up'});
};

const userListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userModel.find().select('-password -role');
    res.json(users);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userGet = async (
  req: Request<{id: String}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select('-password -role');
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    res.json(user);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('usercontroller userPost', req.body);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const user = req.body;
    user.password = await bcrypt.hash(user.password, salt);
    user.role = user.role || 'user';

    const newUser = await userModel.create(user);
    const response: DBMessageResponse = {
      message: 'User created',
      user: {
        user_name: newUser.user_name,
        email: newUser.email,
        id: newUser._id,
      },
    };

    res.json(response);
  } catch (error) {
    console.log('catch', response);
    next(new CustomError('User creation failed', 500));
  }
};

const userPut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userFromToken: OutputUser = res.locals.user as OutputUser;
    const userId = userFromToken.id;
  
    const user: User = req.body as User;
    if (user.password) {
      user.password = await bcrypt.hash(user.password, salt);
    }

    const result: User = (await userModel
      .findByIdAndUpdate(userId, user, {new: true})
      .select('-password -role')) as User;

    if (!result) {
      next(new CustomError('User not found', 404));
      return;
    }

    const response: DBMessageResponse = {
      message: 'User updated',
      user: {
        user_name: result.user_name,
        email: result.email,
        id: result._id,
      },
    };

    res.json(response);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userFromToken: OutputUser = res.locals?.user as OutputUser;
    const userId = userFromToken.id;
    const result: User = (await userModel.findByIdAndDelete(userId)) as User;
    if (!result) {
      next(new CustomError('User not found', 404));
      return;
    }

    const response: DBMessageResponse = {
      message: 'User deleted',
      user: {
        user_name: result.user_name,
        email: result.email,
        id: result._id,
      },
    };

    res.json(response);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};
const userDeleteAsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    if (!res.locals.user.role.includes('admin')) {
      next(new CustomError('Unauthorized', 401));
      return;
    }

    const result: User = (await userModel.findByIdAndDelete(userId)) as User;
    if (!result) {
      next(new CustomError('User not found', 404));
      return;
    }

    const response: DBMessageResponse = {
      message: 'User deleted',
      user: {
        user_name: result.user_name,
        email: result.email,
        id: result._id,
      },
    };

    res.json(response);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userPutAsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    if (!res.locals.user.role.includes('admin')) {
      next(new CustomError('Unauthorized', 401));
      return;
    }

    const user: User = req.body as User;
    if (user.password) {
      user.password = await bcrypt.hash(user.password, salt);
    }

    const result: User = (await userModel
      .findByIdAndUpdate(userId, user, {new: true})
      .select('-password -role')) as User;
    if (!result) {
      next(new CustomError('User not found', 404));
      return;
    }

    const response: DBMessageResponse = {
      message: 'User updated',
      user: {
        user_name: result.user_name,
        email: result.email,
        id: result._id,
      },
    };

    res.json(response);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const checkToken = async (req: Request, res: Response, next: NextFunction) => {
  const userFromToken: OutputUser = res.locals.user as OutputUser;
  const message: DBMessageResponse = {
    message: 'Token is valid',
    user: userFromToken,
  };

  res.json(message);
};

export {
  userPost,
  userPut,
  userDelete,
  check,
  userListGet,
  userGet,
  checkToken,
  userDeleteAsAdmin,
  userPutAsAdmin,
};
