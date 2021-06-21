import { Document, Model, model, Schema } from 'mongoose';

export interface IPost extends Document {
    //
}

export interface IPostModel extends Model<IPost> {

}

const PostSchema = new Schema<IPost, IPostModel>({
    //
});

/*------------------------------------------------------------------*/

export const PostModel = model<IPost>('Post', PostSchema);

PostModel.createIndexes();