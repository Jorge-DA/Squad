import { Request, Response } from 'express';

import { config } from '../config/config';
import { PostModel } from '../models/post';

export function savePost({ body }: Request, res: Response) {
    if (!body) return res.status(400).send({ message: 'Client has not sent params' });
    const newPost = new PostModel(body);
    newPost.save((err, postStored) => {
        if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
        if (!postStored) return res.status(204).send({ message: 'Saved and is not returning any content' });
        return res.status(200).send({ data: postStored });
    });
}

export function listPostPage({ params }: Request, res: Response) {
    const page = Number(params.page);
    if (page < 1) return res.status(400).send({ message: 'Client has not sent params' });

    PostModel.find()
        .skip(config.LIMIT.POST * (page - 1))
        .limit(config.LIMIT.POST)
        .sort('name')
        .select('name')
        .exec(async (err, data) => {
            if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
            if (!data) return res.status(404).send({ message: 'Document not found' });

            const totalDocs = await PostModel.countDocuments();
            const totalPages = Math.ceil(totalDocs / config.LIMIT.POST);
            const hasNextPage = totalPages > page;
            const hasPrevPage = page > 1;
            return res.status(200).send({
                data,
                totalDocs,
                limit: config.LIMIT.POST,
                page,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null,
                hasNextPage,
                hasPrevPage,
                totalPages
            });
        });
}