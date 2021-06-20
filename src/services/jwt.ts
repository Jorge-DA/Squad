import dayjs from 'dayjs';
import { Secret, sign } from 'jsonwebtoken';

import config from '../config/config';
import { IUser } from '../models/user';

export interface Token {
  sub: string;
  nickname: string;
  role: number;
  iat?: number;
  exp?: number;
}

export default function createToken({ _id, nickname, role }: IUser) {
  const payload: Token = {
    sub: _id,
    nickname,
    role,
    iat: dayjs().unix(),
    exp: dayjs().add(30, 'day').unix(),
  };
  return sign(payload, <Secret>config.KEY.SECRET);
}
