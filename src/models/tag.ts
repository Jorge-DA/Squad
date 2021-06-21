import { Document, Model, model, Schema } from 'mongoose';

export interface ITag extends Document {
    //
}

export interface ITagModel extends Model<ITag> {

}

const tagSchema = new Schema<ITag, ITagModel>({
    //
});

/*------------------------------------------------------------------*/

export const TagModel = model<ITag>('Tag', tagSchema);

TagModel.createIndexes();