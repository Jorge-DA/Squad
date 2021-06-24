import { Document, isValidObjectId, Model, model, Schema } from 'mongoose';
import { PostModel, IPost } from './post';
import { UserModel, IUser } from './user';

export interface ILike extends Document {
    readonly post: IPost;
    readonly user: IUser;
    readonly toogle: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

interface ILikeModel extends Model<ILike> {

}

const LikeSchema = new Schema<ILike, ILikeModel>({
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        validate: {
            async validator(_id: string): Promise<boolean> {
                if (!isValidObjectId(_id)) return false;
                return await PostModel
                    .exists({ _id })
                    .then(exists => exists)
                    .catch(err => { throw err; });
            },
            message: ({ value }: { value: string }) => `Post "${value}" no exists.'`,
            reason: 'Invalid Post',
        },
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            async validator(_id: string): Promise<boolean> {
                if (!isValidObjectId(_id)) return false;
                return await UserModel
                    .exists({ _id })
                    .then(exists => exists)
                    .catch(err => { throw err; });
            },
            message: ({ value }: { value: string }) => `User "${value}" no exists.'`,
            reason: 'Invalid User',
        },
    },
    toogle: {
        type: Boolean,
        default: true,
        required: true,
    }
}, {
    timestamps: true,
    autoIndex: true,
});

LikeSchema.index({ post: 1, user: 1 }, { unique: true });

/*------------------------------------------------------------------*/

export const LikeModel = model<ILike, ILikeModel>('Like', LikeSchema);

try {
    LikeModel.createIndexes();
} catch {
    
}