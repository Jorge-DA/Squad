import { Document, isValidObjectId, Model, model, Schema } from 'mongoose';

import { UserModel, IUser } from './user';
import { TagModel, ITag } from './tag';
import { ImageSchema, IImage } from './image';

export interface IPost extends Document {
    readonly image: IImage;
    readonly author: IUser;
    readonly tags: ITag[];
}

export interface IPostModel extends Model<IPost> {

}

const PostSchema = new Schema<IPost, IPostModel>({
    image: ImageSchema,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            async validator(_id: string): Promise<boolean> {
                if (!isValidObjectId(_id)) return false;
                return await UserModel
                    .exists({ _id })
                    .then(exists => exists)
                    .catch(err => { throw err });
            },
            message: ({ value }: { value: string }) => `User "${value}" no exists.'`,
            reason: 'Invalid User',
        },
    },
    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'Tag',
        required: true,
        validate: {
            async validator(_id: string): Promise<boolean> {
                if (!isValidObjectId(_id)) return false;
                return await TagModel
                    .exists({ _id })
                    .then(exists => exists)
                    .catch(err => { throw err });
            },
            message: ({ value }: { value: string }) => `Tag "${value}" no exists.'`,
            reason: 'Invalid Tag',
        },
    }],
});

/*------------------------------------------------------------------*/

export const PostModel = model<IPost>('Post', PostSchema);

PostModel.createIndexes();