import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { Secret, verify } from 'jsonwebtoken';

import config from '../config/config';
import User, { IUser } from '../models/user';
import { Token } from '../services/jwt';

export async function authorized(req: Request, res: Response, next: Function) {
  if (!req.headers.authorization?.startsWith('bearer: ')) return res.status(400).send({ message: 'Client has not sent Token' });
  const token = req.headers.authorization.replace(/['"]+/g, '').split(' ').pop() as string;
  delete req.headers.authorization
  if (!token) return res.status(403).send({ message: 'The user does not have the necessary credentials for this operation' });
  try {
    var payload: Token = <Token>verify(token, <Secret>config.KEY.SECRET);
    const user: IUser | null = await User.findById(payload.sub).select('-password');
    if (
      !user ||
      user.role !== payload?.role ||
      user.nickname !== payload?.nickname ||
      <number>payload?.exp <= dayjs().unix()
    ) return res.status(423).send({ message: 'Access denied' });
    delete payload.iat;
    delete payload.exp;
  } catch {
    return res.status(409).send({ message: 'Error decrypting token' });
  }
  req.user = <IUser>{
    _id: payload.sub,
    nickname: payload.nickname,
    role: payload.role,
  };
  return next();
}

export function authRead({ user, headers }: Request, res: Response, next: Function) {
  if (
    !user ||
    !(user?.role & config.AUTH.READ) ||
    headers.authorization
  ) return res.status(423).send({ message: 'Access denied' });
  else return next();
}

export function authWrite({ user, headers }: Request, res: Response, next: Function) {
  if (
    !user ||
    !(user?.role & config.AUTH.WRITE) ||
    headers.authorization
  ) return res.status(423).send({ message: 'Access denied' });
  else return next();
}

export function authEdit({ user, headers }: Request, res: Response, next: Function) {
  if (
    !user ||
    !(user?.role & config.AUTH.EDIT) ||
    headers.authorization
  ) return res.status(423).send({ message: 'Access denied' });
  else return next();
}

export function authGrant({ user, headers }: Request, res: Response, next: Function) {
  if (
    !user ||
    !(user?.role & config.AUTH.GRANT) ||
    headers.authorization
  ) return res.status(423).send({ message: 'Access denied' });
  else return next();
}

export function authAdmin({ user, headers }: Request, res: Response, next: Function) {
  if (
    !user ||
    !(user?.role & config.AUTH.ADMIN) ||
    headers.authorization
  ) return res.status(423).send({ message: 'Access denied' });
  else return next();
}