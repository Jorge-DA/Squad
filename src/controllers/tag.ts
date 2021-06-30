import { Request, Response } from 'express';

import { TagModel } from '../models/tag';
import { config } from '../config/config';

export function saveTag({ body }: Request, res: Response) {
    if (!body) return res.status(400).send({ message: 'Client has not sent params' });
    const newTag = new TagModel(body);
    newTag.save((err, tagStored) => {
        if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
        if (!tagStored) return res.status(204).send({ message: 'Saved and is not returning any content' });
        return res.status(200).send({ data: tagStored });
    });
}

export function listTag(req: Request, res: Response) {
    TagModel.find().sort('name').select('name').exec((err, tag) => {
        if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
        if (!tag) return res.status(404).send({ message: 'Document not found' });
        return res.status(200).send({ data: tag });
    });
}

export function listTagPage({ params }: Request, res: Response) {
    const page = !isNaN(Number(params.page)) ? Number(params.page) : 1;

    TagModel.find()
        .skip(config.LIMIT.TAG * (page - 1))
        .limit(config.LIMIT.TAG)
        .sort('name')
        .select('name')
        .exec(async (err, data) => {
            if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
            if (!data) return res.status(404).send({ message: 'Document not found' });

            const totalDocs = await TagModel.countDocuments();
            const totalPages = Math.ceil(totalDocs / config.LIMIT.TAG);
            const hasNextPage = totalPages > page;
            const hasPrevPage = page > 1;
            return res.status(200).send({
                data,
                totalDocs,
                limit: config.LIMIT.TAG,
                page,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null,
                hasNextPage,
                hasPrevPage,
                totalPages
            });
        });
}
