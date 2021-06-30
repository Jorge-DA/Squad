import { Request, Response } from "express";
import { FilterQuery, isValidObjectId, QueryOptions, UpdateQuery } from "mongoose";
import { LikeModel, ILike } from "../models/like";

export function toogleLike({ body }: Request, res: Response) {
    if (!body?.post || !body?.user)
        return res.status(400).send({ message: 'Client has not sent body' });

    const post = body.post as any;
    const user = body.user as any;
    const filter: FilterQuery<ILike> = { post, user, };
    const update: UpdateQuery<ILike> = { post, user, toogle: !body?.toogle, }
    const options: QueryOptions = { new: true, upsert: true, }
    LikeModel.findOneAndUpdate(filter, update, options)
        .select(['toogle'])
        .exec((err, LikeUpdated) => {
            if (err) return res.status(409).send({ message: 'Internal error, probably error with body' });
            if (!LikeUpdated) return res.status(200).send({ data: { toogle: false } });
            return res.status(200).send({ data: LikeUpdated });
        });
}

export function getLike({ body }: Request, res: Response) {
    if (!body?.post || !body?.user)
        return res.status(400).send({ message: 'Client has not sent body' });

    LikeModel.findOne()
        .where({ post: body.post, user: body.user })
        .select(['toogle'])
        .exec((err, Like) => {
            if (err) return res.status(409).send({ message: 'Internal error, probably error with body' });
            if (!Like) return res.status(200).send({ data: { toogle: false } });
            return res.status(200).send({ data: Like });
        });
}