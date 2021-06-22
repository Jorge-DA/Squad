import { UploadApiResponse, v2 } from 'cloudinary';
import { Request, Response } from 'express';
import { FilterQuery, isValidObjectId, Types } from 'mongoose';
import { unlink } from 'fs-extra';

import { config } from '../config/config';
import { PostModel } from '../models/post';
import { IImage } from '../models/image';

v2.config({
    cloud_name: config.CLOUDINARY.NAME,
    api_key: config.CLOUDINARY.KEY,
    api_secret: config.CLOUDINARY.SECRET,
});

export async function savePost({ user, body, file }: Request, res: Response) {
    let result: UploadApiResponse;

    if (!body || !user?.roleIncludes(['WRITE', 'EDIT', 'GRANT', 'ADMIN']))
        return res.status(400).send({ message: 'Client has not sent params' });
    if (file) try {
        result = await v2.uploader.upload(file.path, { folder: 'blog/posts' });
        body.image = <IImage>{ public_id: result.public_id, url: result.secure_url, }
    } catch {
        return res.status(409).send({ message: 'Internal error, probably error with params' });
    }
    const newPost = new PostModel(body);
    newPost.save(async (err, data) => {
        if (file) try {
            if (err || !data) await v2.uploader.destroy(result.public_id);
            await unlink(file.path);
        } catch {
            await unlink(file.path);
            return res.status(409).send({ message: 'Internal error, probably error with params' });
        }
        if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
        if (!data) return res.status(204).send({ message: 'Saved and is not returning any content' });
        return res.status(200).send({ data });
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

export function listPostPageTag({ }: Request, res: Response) {

}