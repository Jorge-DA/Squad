import { UploadApiResponse, v2 } from 'cloudinary';
import { Request, Response } from 'express';
import { FilterQuery, isValidObjectId, Types } from 'mongoose';
import { unlink } from 'fs-extra';

import { config } from '../config/config';
import { PostModel } from '../models/post';
import { IImage } from '../models/image';
import { LikeModel } from '../models/like';

v2.config({
    cloud_name: config.CLOUDINARY.NAME,
    api_key: config.CLOUDINARY.KEY,
    api_secret: config.CLOUDINARY.SECRET,
});

export async function savePost({ user, body, file }: Request, res: Response) {
    let result: UploadApiResponse;

    // if (!body || !user?.roleIncludes(['WRITE', 'EDIT', 'GRANT', 'ADMIN']))
    //     return res.status(400).send({ message: 'Client has not sent params' });
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

export function listPostPage({ query }: Request, res: Response) {
    const page = !isNaN(Number(query.page)) ? Number(query.page) : 1;

    const find = PostModel.find()
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(config.LIMIT.POST * (page - 1))
        .limit(config.LIMIT.POST)
        .populate([{
            path: 'author',
            select: ['nickname'],
        }, {
            path: 'tags',
            select: 'name',
        }]);

    const search = PostModel.find();
    if (query?.tags)
        search.where('tags').all(query.tags as string[]);

    find.merge(search).exec(async (err, data) => {
        if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
        if (!data) return res.status(404).send({ message: 'Document not found' });

        const totalDocs = await PostModel.countDocuments().merge(search);
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

export function listPostTrends({ query }: Request, res: Response) {
    const page = !isNaN(Number(query.page)) ? Number(query.page) : 1;

    LikeModel.aggregate([{
        $match: {
            toogle: true
        }
    }, {
        $group: {
            _id: "$post",
            count: {
                $sum: 1
            }
        }
    }, {
        $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: '_id',
            as: 'post'
        }
    }, {
        $unwind: {
            path: "$post"
        }
    }, {
        $lookup: {
            from: 'users',
            localField: 'post.author',
            foreignField: '_id',
            as: 'author'
        }
    }, {
        $lookup: {
            from: 'tags',
            localField: 'post.tags',
            foreignField: '_id',
            as: 'tags'
        }
    }, {
        $unwind: {
            path: "$author",
        }
    }, {
        $project: {
            _id: "$post._id",
            image: "$post.image",
            count: 1,
            tags: 1,
            "author.nickname": 1,
        }
    }, {
        $sort: {
            count: -1,
        }
    }, {
        $limit: config.LIMIT.POST,
    }]).exec((err, data) => {
        if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
        if (!data) return res.status(404).send({ message: 'Document not found' });
        return res.status(200).send({ data });
    });
}

export function deletePost({ query }: Request, res: Response) {
    if (!query.id)
        return res.status(400).send({ message: "Client has not sent params" });

    PostModel.findOneAndDelete({ _id: query.id }, {}, async (err, post) => {
        if (err) return res.status(409).send({ message: "Internal error, probably error with params" });
        if (!post) return res.status(404).send({ message: "Document not found" });
        try {
            await v2.uploader.destroy(post.image.public_id);
        } catch {
            if (err) return res.status(409).send({ message: "Internal error, probably error with params" });
        }
        LikeModel.deleteMany({ post: post._id }).exec((err, data) => {
            if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
            if (!data) return res.status(404).send({ message: 'Document not found' });
            return res.status(200).send({ data: post });
        });
    });
}