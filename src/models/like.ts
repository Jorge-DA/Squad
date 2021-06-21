import { Document, Model, model, Schema } from 'mongoose';

export interface ILike extends Document {
    //
}

export interface ILikeModel extends Model<ILike> {

}

const LikeSchema = new Schema<ILike, ILikeModel>({
    //
});

/*------------------------------------------------------------------*/

export const LikeModel = model<ILike>('Like', LikeSchema);

LikeModel.createIndexes();