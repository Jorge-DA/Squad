import { Request, Response } from "express";
import { FilterQuery, isValidObjectId, QueryOptions, UpdateQuery } from "mongoose";
import { LikeModel, ILike } from "../models/like";

export function toogleLike({ query, body }: Request, res: Response) {
    if (!isValidObjectId(query?.post) || !isValidObjectId(query?.user))
        return res.status(400).send({ message: 'Client has not sent query' });

    const post = query.post as any;
    const user = query.user as any;
    const filter: FilterQuery<ILike> = { post, user, };
    const update: UpdateQuery<ILike> = { post, user, toogle: !body?.toogle, }
    const options: QueryOptions = { upsert: true, }
    LikeModel.findOneAndUpdate(filter, update, options)
        .select(['toogle'])
        .exec((err, LikeUpdated) => {
            if (err) return res.status(409).send({ message: 'Internal error, probably error with query' });
            if (!LikeUpdated) return res.status(200).send({ data: { toogle: false } });
            return res.status(200).send({ data: LikeUpdated });
        });
}

export function getLike({ query }: Request, res: Response) {
    if (!isValidObjectId(query?.post) || !isValidObjectId(query?.user))
        return res.status(400).send({ message: 'Client has not sent query' });

    LikeModel.findOne()
        .where({ post: query.post, user: query.user })
        .select(['toogle'])
        .exec((err, Like) => {
            if (err) return res.status(409).send({ message: 'Internal error, probably error with query' });
            if (!Like) return res.status(200).send({ data: { toogle: false } });
            return res.status(200).send({ data: Like });
        });
}