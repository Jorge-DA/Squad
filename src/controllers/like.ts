import { Request, Response } from "express";
import { FilterQuery, isValidObjectId, QueryOptions, UpdateQuery } from "mongoose";
import { LikeModel, ILike } from "../models/like";

export function toogleLike({ params, body }: Request, res: Response) {
    if (!isValidObjectId(params?.post) || !isValidObjectId(params?.user))
        return res.status(400).send({ message: 'Client has not sent params' });

    const post = params.post as any;
    const user = params.user as any;
    const query: FilterQuery<ILike> = { post, user, };
    const update: UpdateQuery<ILike> = { post, user, toogle: !body?.toogle, }
    const options: QueryOptions = { upsert: true, }
    LikeModel.findOneAndUpdate(query, update, options)
        .select(['toogle'])
        .exec((err, LikeUpdated) => {
            if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
            if (!LikeUpdated) return res.status(200).send({ data: { toogle: false } });
            return res.status(200).send({ data: LikeUpdated });
        });
}

export function getLike({ params }: Request, res: Response) {
    if (!isValidObjectId(params?.post) || !isValidObjectId(params?.user))
        return res.status(400).send({ message: 'Client has not sent params' });

    LikeModel.findOne()
        .where({ post: params.post, user: params.user })
        .select(['toogle'])
        .exec((err, Like) => {
            if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
            if (!Like) return res.status(200).send({ data: { toogle: false } });
            return res.status(200).send({ data: Like });
        });
}