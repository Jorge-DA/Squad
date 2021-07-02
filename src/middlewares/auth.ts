import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { Secret, verify } from 'jsonwebtoken';

import { config } from '../config/config';
import { UserModel, IUser, Token } from '../models/user';

export async function authorized(req: Request, res: Response, next: (err?: Error) => void) {
  if (!req.headers.authorization?.startsWith('bearer: ') && !req.headers.authorization?.includes('"'))
    return res.status(400).send({ message: 'El cliente no ha enviado el token' });
  const token = req.headers.authorization.replace(/['"]+/g, '').split(' ').pop() as string;
  delete req.headers.authorization
  if (!token) return res.status(403).send({ message: 'El usuario no tiene las credenciales necesarias para esta operación' });
  try {
    var payload: Token = <Token>verify(token, <Secret>config.KEY.SECRET);
    const user: IUser | null = await UserModel.findById(payload.sub).select('-password');
    if (
      !user ||
      user.role !== payload?.role ||
      user.nickname !== payload?.nickname ||
      <number>payload?.exp <= dayjs().unix()
    ) return res.status(423).send({ message: 'Acceso denegado' });

    delete payload.iat;
    delete payload.exp;
    req.user = user;
  } catch {
    return res.status(409).send({ message: 'Error al descifrar el token' });
  }
  return next();
}